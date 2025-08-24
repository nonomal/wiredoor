import { ObjectSchema, ValidationError } from 'joi';
import Joi from './joi-validator';
import config from '../config';
import { FilterQueryDto } from '../repositories/filters/repository-query-filter';
import Net from '../utils/net';

export const nslookupResolvesServerIp = async (c: string): Promise<string> => {
  if (c) {
    const lookup = await Net.lookupIncludesThisServer(c);

    if (!lookup) {
      throw new ValidationError(
        `nslookup failed`,
        [
          {
            path: ['domain'],
            message: `nslookup doesn't resolves your server IP: ${config.wireguard.host}`,
            type: 'Error',
          },
        ],
        null,
      );
    }
  }

  return c;
};

export interface DomainType {
  domain: string;
  ssl?: string;
  validation?: boolean;
  authentication?: boolean;
  allowedEmails?: string[];
  skipAuthRoutes?: string;
}

export interface DomainFilterQueryParams extends FilterQueryDto {
  limit?: number;
  page?: number;
  orderBy?: string;
}

export const domainFilterValidator: ObjectSchema<DomainFilterQueryParams> =
  Joi.object({
    limit: Joi.number().optional(),
    page: Joi.number().optional(),
    orderBy: Joi.string()
      .pattern(/,(asc|desc)$/)
      .optional(),
  });

export const domainValidator: ObjectSchema<DomainType> = Joi.object({
  domain: Joi.string().when('skipValidation', {
    is: true,
    then: Joi.string()
      .pattern(
        new RegExp(`^([a-zA-Z0-9-]+\\.)+([a-zA-Z]{2,})$`),
        'domain structure',
      )
      .required(),
    otherwise: Joi.string()
      .domain()
      .external(nslookupResolvesServerIp)
      .required(),
  }),
  ssl: Joi.string().when('skipValidation', {
    is: true,
    then: Joi.valid('self-signed').allow(null).optional(),
    otherwise: Joi.valid('self-signed', 'certbot').allow(null).optional(),
  }),
  authentication: Joi.boolean().optional(),
  allowedEmails: Joi.when('authentication', {
    is: true,
    then: Joi.array()
      .items(Joi.string().email().optional())
      .unique()
      .optional(),
    otherwise: Joi.array().max(0).allow(null).optional(),
  }),
  skipValidation: Joi.boolean().optional(),
});
