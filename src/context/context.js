import React, { useState, useEffect, createContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

export const GithubContext = createContext();

export const GithubProvider = ({ children }) => {
  //eslint-disable-next-line
  const [githubUser, setGithubUser] = useState(mockUser);
  //eslint-disable-next-line
  const [repos, setRepos] = useState(mockRepos);
  //eslint-disable-next-line
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  //eslint-disable-next-line
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  // error
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);

    const res = await axios(`${rootUrl}/users/${user}`).catch((error) =>
      console.log(error)
    );

    if (res) {
      setGithubUser(res.data);
      const { login, followers_url } = res.data;

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((result) => {
          const [repos, followers] = result;
          const status = "fulfilled";

          if (repos.status === status) {
            setRepos(repos.value.data);
          }

          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((error) => console.log(error));
    } else {
      toggleError(true, "Not a valid Username");
    }

    checkRequests();
    setIsLoading(false);
  };

  // Check Remaining Requests
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "You've reached your hourly limit");
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(checkRequests, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        isLoading,
        searchGithubUser,
      }}>
      {children}
    </GithubContext.Provider>
  );
};
