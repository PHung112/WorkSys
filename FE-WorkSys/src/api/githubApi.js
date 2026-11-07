import http from "./axiosConfig";

const githubApi = {
  getStatus: () => http.get("/api/github/status"),
  connectToken: (token) => http.post("/api/github/connect-token", { token }),
  disconnectUser: () => http.post("/api/github/disconnect-user"),
  getRepos: () => http.get("/api/github/repos"),
  autoConnectProject: (projectId, data) =>
    http.post(`/api/github/projects/${projectId}/auto-connect`, data),
  disconnectProject: (projectId) =>
    http.post(`/api/github/projects/${projectId}/disconnect`),
  getOAuthAuthorizeUrl: (redirectUri) =>
    http.get("/api/github/oauth/authorize-url", { params: { redirectUri } }),
  handleOAuthCallback: (code) => http.post("/api/github/oauth/callback", { code }),
};

export default githubApi;
