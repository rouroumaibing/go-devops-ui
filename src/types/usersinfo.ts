export interface Users {
    id?: string;
    accountname: string;
    accountgroup?: string;
    nickname?: string;
    head_img?: string;
    age?: number;
    address?: string;
    password?: string;
    email?: string;
    phone?: string;
    wechat?: string;
    qq?: string;
    identitycard?: string;
    created_at?: string;
    updated_at?: string;
}

export interface UserIDRespone {
    id: string;
}
