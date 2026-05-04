import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const domain = req.get('host').match(/\w+/); // e.g., host: "subdomain.website.com"
    if (domain) {
      const subdomain = domain[0]; // Use "subdomain"
    }

    next();
  }
}
