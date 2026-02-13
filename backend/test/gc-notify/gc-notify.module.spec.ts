import { GcNotifyModule } from '../../src/gc-notify/gc-notify.module';
import { GcNotifyService } from '../../src/gc-notify/gc-notify.service';
import { InMemoryTemplateResolver } from '../../src/gc-notify/transports/in-memory-template.resolver';
import { HandlebarsTemplateRenderer } from '../../src/gc-notify/transports/handlebars/handlebars-template.renderer';
import {
  TEMPLATE_RESOLVER,
  TEMPLATE_RENDERER,
} from '../../src/gc-notify/transports/tokens';

describe('GcNotifyModule', () => {
  it('forRoot returns dynamic module with default resolver and renderer', () => {
    const dynamic = GcNotifyModule.forRoot();

    expect(dynamic.module).toBe(GcNotifyModule);
    expect(dynamic.global).toBe(true);
    expect(dynamic.exports).toContain(GcNotifyService);

    const resolverProvider = dynamic.providers?.find(
      (p: { provide?: symbol }) => p.provide === TEMPLATE_RESOLVER,
    ) as { useClass: unknown };
    const rendererProvider = dynamic.providers?.find(
      (p: { provide?: symbol }) => p.provide === TEMPLATE_RENDERER,
    ) as { useClass: unknown };

    expect(resolverProvider.useClass).toBe(InMemoryTemplateResolver);
    expect(rendererProvider.useClass).toBe(HandlebarsTemplateRenderer);
  });

  it('forRoot uses custom resolver and renderer when provided', () => {
    class CustomResolver {}
    class CustomRenderer {}

    const dynamic = GcNotifyModule.forRoot({
      templateResolver: CustomResolver,
      templateRenderer: CustomRenderer,
    });

    const resolverProvider = dynamic.providers?.find(
      (p: { provide?: symbol }) => p.provide === TEMPLATE_RESOLVER,
    ) as { useClass: unknown };
    const rendererProvider = dynamic.providers?.find(
      (p: { provide?: symbol }) => p.provide === TEMPLATE_RENDERER,
    ) as { useClass: unknown };

    expect(resolverProvider.useClass).toBe(CustomResolver);
    expect(rendererProvider.useClass).toBe(CustomRenderer);
  });
});
