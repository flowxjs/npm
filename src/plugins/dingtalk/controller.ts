import { Controller, Get, Query, BadGatewayException } from '@flowx/http';
import request from 'request';
import crypto from 'crypto';
import { inject } from 'inversify';
import { ConfigService } from '../../modules/configs/config.service';
import { Connection } from 'typeorm';
import { ConfigEntity } from '../../modules/configs/config.mysql.entity';
import { ThirdpartyEntity } from '../../modules/thirdparty/thirdparty.mysql.entity';
import { ThirdPartyService } from '../../modules/thirdparty/thirdparty.service';
import { TypeRedis } from '@flowx/redis';
import axios, { AxiosResponse } from 'axios';

interface TCommonResult {
  errcode: number,
  errmsg: string,
}

interface TOpenID extends TCommonResult {
  user_info: {
    nick: string,
    openid: string,
    unionid: string,
    dingId?: string,
    main_org_auth_high_level?: boolean,
  }
}

interface TAccessToken extends TCommonResult {
  access_token: string,
}

interface TUserID extends TCommonResult {
  contactType: number,
  userid: string,
}

interface TUserInfo extends TCommonResult {
  "unionid": string,
  "remark": string,
  "userid": string,
  "isLeaderInDepts": string,
  "isBoss": boolean,
  "hiredDate": number,
  "isSenior": boolean,
  "tel": string,
  "department": number[],
  "workPlace": string,
  "email": string,
  "orderInDepts": string,
  "mobile": string,
  "active": boolean,
  "avatar": string,
  "isAdmin": boolean,
  "isHide": boolean,
  "jobnumber": string,
  "name": string,
  "extattr": any,
  "stateCode": string,
  "position": string,
  "roles": {
    "id": number,
    "name": string,
    "groupName": string
  }[]
}

@Controller('/-/thirdparty/dingtalk')
export class HttpThirdPartyDingTalkController {
  @inject('Redis') private redis: TypeRedis;
  @inject('MySQL') private connection: Connection;
  @inject(ConfigService) private ConfigService: ConfigService;
  @inject(ThirdPartyService) private ThirdPartyService: ThirdPartyService;

  @Get('/authorize')
  async Authorize(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const timestamp = Date.now();
    const ConfigRepository = this.connection.getRepository(ConfigEntity);
    const ThirdpartyRepository = this.connection.getRepository(ThirdpartyEntity);

    const configs = await this.ConfigService.query(ConfigRepository);
    const thirdparty = await this.ThirdPartyService.query(ThirdpartyRepository, configs.loginType);
    const extra = thirdparty.extra;

    const access_token = await this.getAccessToken(extra.app.appkey, extra.app.appsecret, state);
    const { unionid, openid } = await this.getOpenID(extra.login.appid, timestamp, extra.login.appsecret, code, state);
    const userid = await this.getUserId(access_token, unionid, state);
    const user = await this.getUserInfo(access_token, userid, state);

    const userRedisData: { hostname: string, user?: (typeof user) & { openid: string } } = await this.redis.get(`thirdparty:${state}`);
    await this.redis.set(`thirdparty:${state}`, {
      hostname: userRedisData.hostname,
      user: Object.assign(user, { openid }),
    }, thirdparty.loginTimeExpire);
    
    return user.nickname + '，恭喜您，钉钉登录成功!';
  }

  @Get('/check')
  async Check(@Query('session') session: string) {
    const userRedisData: { hostname: string, user?: {
      account: string, 
      avatar: string, 
      email: string, 
      nickname: string,
      openid: string,
    }} = await this.redis.get(`thirdparty:${session}`);
    if (!userRedisData) throw new BadGatewayException();
    if (!userRedisData.user) return;
    await this.cleanRedis(session);
    return { 
      account: userRedisData.user.account, 
      avatar: userRedisData.user.avatar, 
      email: userRedisData.user.email, 
      token: userRedisData.user.openid, 
      nickname: userRedisData.user.nickname,
    }
  }

  private signature(timestamp: number, appSecret: string) {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(timestamp + '');
    return encodeURIComponent(hmac.digest('base64'));
  }

  private async cleanRedis(session: string) {
    await this.redis.del(`thirdparty:${session}`);
  }

  private async getOpenID(appid: string, timestamp: number, appsecret: string, code: string, session: string) {
    const signature = this.signature(timestamp, appsecret);
    const url = `https://oapi.dingtalk.com/sns/getuserinfo_bycode?accessKey=${appid}&timestamp=${timestamp}&signature=${signature}`;
    const res = await axios.post<any, AxiosResponse<TOpenID>>(url, {
      tmp_auth_code: code
    });
    const data = res.data;
    if (data.errcode > 0) {
      await this.cleanRedis(session);
      throw new BadGatewayException(data.errmsg);
    }
    return {
      openid: data.user_info.openid,
      unionid: data.user_info.unionid,
    }
  }

  private async getAccessToken(appid: string, appsecret: string, session: string) {
    const res = await axios.get<any, AxiosResponse<TAccessToken>>(`https://oapi.dingtalk.com/gettoken?appkey=${appid}&appsecret=${appsecret}`);
    const data = res.data;
    if (data.errcode > 0) {
      await this.cleanRedis(session);
      throw new BadGatewayException(data.errmsg);
    }
    return data.access_token;
  }

  private async getUserId(access_token: string, unionid: string, session: string) {
    const res = await axios.get<any, AxiosResponse<TUserID>>(`https://oapi.dingtalk.com/user/getUseridByUnionid?access_token=${access_token}&unionid=${unionid}`);
    const data = res.data;
    if (data.errcode > 0) {
      await this.cleanRedis(session);
      throw new BadGatewayException(data.errmsg);
    }
    return data.userid;
  }

  private async getUserInfo(access_token: string, userid: string, session: string) {
    const res = await axios.get<any, AxiosResponse<TUserInfo>>(`https://oapi.dingtalk.com/user/get?access_token=${access_token}&userid=${userid}`);
    const data = res.data;
    if (data.errcode > 0) {
      await this.cleanRedis(session);
      throw new BadGatewayException(data.errmsg);
    }
    return {
      account: data.userid, 
      avatar: data.avatar, 
      email: data.email, 
      nickname: data.name,
    }
  }
}