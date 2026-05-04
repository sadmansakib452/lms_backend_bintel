import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomForbiddenException extends HttpException {
  constructor(message: string) {
    super(
      {
        success: false,
        message: message || 'Forbidden access',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
