import { TransportsModule } from '../../src/transports/transports.module';
import { EMAIL_TRANSPORT, SMS_TRANSPORT } from '../../src/transports/tokens';
import { NodemailerEmailTransport } from '../../src/transports/nodemailer/nodemailer-email.transport';
import { TwilioSmsTransport } from '../../src/transports/twilio/twilio-sms.transport';

describe('TransportsModule', () => {
  it('forRoot returns dynamic module with default transports when no options', () => {
    const dynamic = TransportsModule.forRoot();

    expect(dynamic.module).toBe(TransportsModule);
    expect(dynamic.global).toBe(true);
    expect(dynamic.providers).toHaveLength(2);
    expect(dynamic.exports).toEqual([EMAIL_TRANSPORT, SMS_TRANSPORT]);

    const emailProvider = dynamic.providers?.[0] as {
      provide: symbol;
      useClass: unknown;
    };
    const smsProvider = dynamic.providers?.[1] as {
      provide: symbol;
      useClass: unknown;
    };

    expect(emailProvider.provide).toBe(EMAIL_TRANSPORT);
    expect(emailProvider.useClass).toBe(NodemailerEmailTransport);
    expect(smsProvider.provide).toBe(SMS_TRANSPORT);
    expect(smsProvider.useClass).toBe(TwilioSmsTransport);
  });

  it('forRoot uses custom transports when provided', () => {
    class CustomEmailTransport {}
    class CustomSmsTransport {}

    const dynamic = TransportsModule.forRoot({
      emailTransport: CustomEmailTransport,
      smsTransport: CustomSmsTransport,
    });

    const emailProvider = dynamic.providers?.[0] as {
      provide: symbol;
      useClass: unknown;
    };
    const smsProvider = dynamic.providers?.[1] as {
      provide: symbol;
      useClass: unknown;
    };

    expect(emailProvider.useClass).toBe(CustomEmailTransport);
    expect(smsProvider.useClass).toBe(CustomSmsTransport);
  });
});
