import url from 'url';
import { TypeServiceInjection } from '@flowx/container';
import { Http } from '@flowx/http';
import { HttpThirdPartyDingTalkController } from './controller';
import { Connection } from 'typeorm';
import { ThirdPartyService } from '../../modules/thirdparty/thirdparty.service';
import { ThirdpartyEntity } from '../../modules/thirdparty/thirdparty.mysql.entity';
import { DOMAIN } from '../../app.config';
import { ConfigService } from '../../modules/configs/config.service';
import { ConfigEntity } from '../../modules/configs/config.mysql.entity';

const codeid = 'dingtalk';

interface TSetupConfigs {
  login: {
    appid: string,
    appsecret: string,
  },
  app: {
    appkey: string,
  appsecret: string,
  }
}

export function Setup(http: Http, options: TSetupConfigs) {
  http.useController(HttpThirdPartyDingTalkController);
  http.container.setup(async () => {
    const connection = TypeServiceInjection.get<Connection>('MySQL');
    const thirdpartyRepository = connection.getRepository(ThirdpartyEntity);
    const configRepository = connection.getRepository(ConfigEntity);

    const thirdpartyService = TypeServiceInjection.get(ThirdPartyService);
    const configService = TypeServiceInjection.get(ConfigService);

    const configs: ConfigEntity | null = await configService.query(configRepository).catch(e => {
      if (e.message === '找不到配置数据') return null;
      throw e;
    });
    const domain = configs ? configs.domain : DOMAIN;
    const redirect_url = encodeURIComponent(url.resolve(domain, '/-/thirdparty/dingtalk/authorize'))
    await thirdpartyService.insert(
      thirdpartyRepository, 
      codeid, JSON.stringify(options), 
      '钉钉登录',
      'https://oapi.dingtalk.com/connect/qrconnect?appid={AppId}&response_type=code&scope=snsapi_login&state={Session}&redirect_uri=' + redirect_url, 
      url.resolve(domain, '/-/thirdparty/dingtalk/check?session={Session}'),
      30, 5
    );
  })
}