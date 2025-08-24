import Container from 'typedi';
import WireguardService from '../services/wireguard/wireguard-service';
import { HttpServicesService } from '../services/http-services-service';
import { TcpServicesService } from '../services/tcp-services-service';
import { DomainsService } from '../services/domains-service';
import { NginxManager } from '../services/proxy-server/nginx-manager';
import { logger } from './logger';

export default async (): Promise<void> => {
  try {
    await Container.get(WireguardService).initialize();
  } catch (e) {
    logger.warn(e, `Unable to initialize VPN server`);
  }

  try {
    await Container.get(DomainsService).initialize();
  } catch (e) {
    logger.error(e, `Unable to initialize Domains`);
  }

  try {
    await Container.get(HttpServicesService).initialize();
  } catch (e) {
    logger.error(e, `Unable to initialize HTTP Services`);
  }

  try {
    await Container.get(TcpServicesService).initialize();
  } catch (e) {
    logger.error(e, `Unable to initialize TCP Services`);
  }

  await NginxManager.reloadServer();
};
