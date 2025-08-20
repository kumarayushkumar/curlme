export interface GitHubDeviceTokenResponse {
  access_token: string
  token_type: string
  scope: string
}

export interface GitHubUser {
  login: string
  name: string
  id: number
}

export interface GitHubDeviceFlowResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}
