import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUsersRepository } from '../../../auth/domain/repositories/auth-users.repository';
import { PasswordHasher } from '../../../auth/domain/services/password-hasher';
import { ReopenInstallmentDto } from '../dto/reopen-installment.dto';
import { PaymentsRepository } from '../../domain/repositories/payments.repository';

@Injectable()
export class ReopenInstallmentUseCase {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly authUsersRepository: AuthUsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    companyId: string,
    installmentId: string,
    userId: string,
    input: ReopenInstallmentDto,
  ) {
    const [installment, user] = await Promise.all([
      this.paymentsRepository.findInstallmentForPayment(
        companyId,
        installmentId,
      ),
      this.authUsersRepository.findById(userId),
    ]);

    if (!installment) {
      throw new NotFoundException('Parcela nao encontrada.');
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Nao foi possivel confirmar a senha do usuario atual.',
      );
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Senha incorreta.');
    }

    if (installment.status !== 'PAID') {
      throw new BadRequestException(
        'Apenas parcelas quitadas podem ser marcadas novamente como nao pagas.',
      );
    }

    await this.paymentsRepository.reopenInstallment({
      companyId,
      installmentId,
      reversedByUserId: user.id,
      reversalReason: 'Parcela reaberta via confirmacao de senha.',
    });
  }
}
