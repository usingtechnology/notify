import {
  EMAIL_TRANSPORT_REGISTRY,
  SMS_TRANSPORT_REGISTRY,
} from '../../src/transports/transport.registry';
import { NodemailerEmailTransport } from '../../src/transports/nodemailer/nodemailer-email.transport';
import { TwilioSmsTransport } from '../../src/transports/twilio/twilio-sms.transport';

describe('transport.registry', () => {
  it('EMAIL_TRANSPORT_REGISTRY maps nodemailer to NodemailerEmailTransport', () => {
    expect(EMAIL_TRANSPORT_REGISTRY.nodemailer).toBe(NodemailerEmailTransport);
  });

  it('EMAIL_TRANSPORT_REGISTRY contains only expected keys', () => {
    expect(Object.keys(EMAIL_TRANSPORT_REGISTRY)).toEqual(['nodemailer']);
  });

  it('SMS_TRANSPORT_REGISTRY maps twilio to TwilioSmsTransport', () => {
    expect(SMS_TRANSPORT_REGISTRY.twilio).toBe(TwilioSmsTransport);
  });

  it('SMS_TRANSPORT_REGISTRY contains only expected keys', () => {
    expect(Object.keys(SMS_TRANSPORT_REGISTRY)).toEqual(['twilio']);
  });
});
