export interface XboxUserData {
  user_hash: string;
  xsts_token: string;
  expires_on: string;
}

export interface XboxUser {
  id: string;
  settings: { id: string; value: string }[];
}

export interface XboxGetUsersByXuidsBody {
  userIds: string[];
  settings: string[];
}

export interface XboxGetUsersByXuids {
  profileUsers: XboxUser[];
}

export interface XboxAuth {
  user_hash: string;
  xsts_token: string;
}
