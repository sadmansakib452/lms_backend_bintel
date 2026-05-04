import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ExecutionContext } from '@nestjs/common';

const mockAuthService = {
  me: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
  register: jest.fn().mockResolvedValue({ success: true }),
  login: jest.fn().mockResolvedValue({
    authorization: { access_token: 'access', refresh_token: 'refresh' },
    user: { id: 1, email: 'test@example.com' },
  }),
  refreshToken: jest.fn().mockResolvedValue({ access_token: 'new_access' }),
  revokeRefreshToken: jest.fn().mockResolvedValue({ success: true }),
  updateUser: jest.fn().mockResolvedValue({ success: true }),
  forgotPassword: jest.fn().mockResolvedValue({ success: true }),
  verifyEmail: jest.fn().mockResolvedValue({ success: true }),
  resendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  resetPassword: jest.fn().mockResolvedValue({ success: true }),
  changePassword: jest.fn().mockResolvedValue({ success: true }),
  requestEmailChange: jest.fn().mockResolvedValue({ success: true }),
  changeEmail: jest.fn().mockResolvedValue({ success: true }),
  generate2FASecret: jest.fn().mockResolvedValue({ qr: 'base64' }),
  verify2FA: jest.fn().mockResolvedValue({ valid: true }),
  enable2FA: jest.fn().mockResolvedValue({ enabled: true }),
  disable2FA: jest.fn().mockResolvedValue({ disabled: true }),
};

// Fake user injection
const mockUserRequest = {
  user: {
    userId: 1,
    email: 'test@example.com',
  },
};

// Mock JWT Guard
const mockJwtAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = mockUserRequest.user;
    return true;
  },
};

// Mock LocalAuthGuard
const mockLocalAuthGuard = {
  canActivate: () => true,
  handleRequest: () => mockUserRequest.user,
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(LocalAuthGuard)
      .useValue(mockLocalAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    const dto = {
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'password',
      type: 'user',
    };
    const result = await controller.create(dto);
    expect(result.success).toBe(true);
  });

  it('should return current user info', async () => {
    const result = await controller.me({ user: { userId: 1 } } as any);
    expect(result.data.id).toBe(1);
  });

  it('should login a user', async () => {
    const res = {
      cookie: jest.fn(),
      json: jest.fn(),
    };
    await controller.login({ user: mockUserRequest.user } as any, res as any);
    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('should refresh token', async () => {
    const result = await controller.refreshToken(
      { user: { userId: 1 } } as any,
      { refresh_token: 'refresh' },
    );
    expect(result.authorization.access_token).toBe('new_access');
  });

  it('should logout user', async () => {
    const result = await controller.logout({ user: { userId: 1 } } as any);
    expect(result.success).toBe(true);
  });

  it('should update user', async () => {
    const result = await controller.updateUser(
      { user: { userId: 1 } } as any,
      {},
      {} as any,
    );
    expect(result.success).toBe(true);
  });

  it('should handle forgot password', async () => {
    const result = await controller.forgotPassword({ email: 'john@example.com' });
    expect(result.success).toBe(true);
  });

  it('should verify email', async () => {
    const result = await controller.verifyEmail({ email: 'john@example.com', token: '1234' });
    expect(result.success).toBe(true);
  });

  it('should resend verification email', async () => {
    const result = await controller.resendVerificationEmail({ email: 'john@example.com' });
    expect(result.success).toBe(true);
  });

  it('should reset password', async () => {
    const result = await controller.resetPassword({
      email: 'john@example.com',
      token: '1234',
      password: 'newpass',
    });
    expect(result.success).toBe(true);
  });

  it('should change password', async () => {
    const result = await controller.changePassword(
      { user: { userId: 1 } } as any,
      { email: 'john@example.com', old_password: 'oldpass', new_password: 'newpass' },
    );
    expect(result.success).toBe(true);
  });

  it('should request email change', async () => {
    const result = await controller.requestEmailChange(
      { user: { userId: 1 } } as any,
      { email: 'new@example.com' },
    );
    expect(result.success).toBe(true);
  });

  it('should change email', async () => {
    const result = await controller.changeEmail(
      { user: { userId: 1 } } as any,
      { email: 'new@example.com', token: 'token123' },
    );
    expect(result.success).toBe(true);
  });

  it('should generate 2FA secret', async () => {
    const result = await controller.generate2FASecret({ user: { userId: 1 } } as any);
    expect(result.data.qrCode).toBe('base64');
  });

  it('should verify 2FA token', async () => {
    const result = await controller.verify2FA(
      { user: { userId: 1 } } as any,
      { token: '123456' },
    );
    expect(result.success).toBe(true);
  });

  it('should enable 2FA', async () => {
    const result = await controller.enable2FA({ user: { userId: 1 } } as any);
    expect(result.success).toBe(true);
  });

  it('should disable 2FA', async () => {
    const result = await controller.disable2FA({ user: { userId: 1 } } as any);
    expect(result.success).toBe(true);
  });
});
