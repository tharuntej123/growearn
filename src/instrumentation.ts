export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { AdminBootstrapService } = await import('@/services/admin-bootstrap.service');
    await AdminBootstrapService.bootstrapAdminIfNeeded();
  }
}

