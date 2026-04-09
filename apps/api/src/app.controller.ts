import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      name: 'Sistema Vendas API',
      version: '0.1.0',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
