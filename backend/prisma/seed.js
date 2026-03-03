import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  // Escritórios
  const office = await prisma.office.upsert({
    where: { id: 'demo-office-1' },
    update: {},
    create: {
      id: 'demo-office-1',
      name: 'Escritório Demo',
      plan: 'team',
      maxUsers: 5,
    },
  });

  const officeHub = await prisma.office.upsert({
    where: { id: 'hub-office-1' },
    update: {},
    create: {
      id: 'hub-office-1',
      name: 'Hub Central',
      plan: 'office',
      maxUsers: 20,
    },
  });

  // Usuários
  const user = await prisma.user.upsert({
    where: { email: 'demo@advcargo.com.br' },
    update: {},
    create: {
      email: 'demo@advcargo.com.br',
      password: hash,
      name: 'Advogado Demo',
      officeId: office.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hubcentral.com' },
    update: { password: hash },
    create: {
      email: 'admin@hubcentral.com',
      password: hash,
      name: 'Administrador',
      role: 'admin',
      officeId: officeHub.id,
    },
  });

  const systemOffice = await prisma.office.upsert({
    where: { id: 'system-office-1' },
    update: {},
    create: {
      id: 'system-office-1',
      name: 'Sistema (sem dados de escritório)',
      plan: 'individual',
      maxUsers: 1,
    },
  });

  await prisma.user.upsert({
    where: { email: 'vanderson@hubcentral.com' },
    update: { password: hash },
    create: {
      email: 'vanderson@hubcentral.com',
      password: hash,
      name: 'Vanderson (Dev)',
      role: 'dev',
      officeId: systemOffice.id,
    },
  });

  // Cliente e processo do escritório Demo (já existente)
  const client = await prisma.client.upsert({
    where: { id: 'demo-client-1' },
    update: {},
    create: {
      id: 'demo-client-1',
      name: 'João Silva',
      document: '123.456.789-00',
      type: 'pf',
      email: 'joao@email.com',
      phone: '(11) 99999-0000',
      officeId: office.id,
    },
  });

  await prisma.process.upsert({
    where: { id: 'demo-process-1' },
    update: {},
    create: {
      id: 'demo-process-1',
      number: '0001234-56.2024.8.26.0100',
      court: '1ª Vara Cível',
      subject: 'Ação de Indenização',
      causeValue: 50000,
      status: 'ativo',
      parts: 'João Silva x Empresa XYZ',
      clientId: client.id,
      responsibleId: user.id,
      officeId: office.id,
    },
  });

  // --- Dados do Hub Central (admin@hubcentral.com) ---

  const clientsHub = await Promise.all([
    prisma.client.upsert({
      where: { id: 'hub-client-1' },
      update: {},
      create: {
        id: 'hub-client-1',
        name: 'Maria Santos',
        document: '987.654.321-00',
        type: 'pf',
        email: 'maria.santos@email.com',
        phone: '(11) 98888-1111',
        address: 'Rua das Flores, 100 - São Paulo/SP',
        officeId: officeHub.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'hub-client-2' },
      update: {},
      create: {
        id: 'hub-client-2',
        name: 'Tech Solutions Ltda',
        document: '12.345.678/0001-90',
        type: 'pj',
        email: 'contato@techsolutions.com.br',
        phone: '(11) 3333-4444',
        address: 'Av. Paulista, 1000 - São Paulo/SP',
        officeId: officeHub.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'hub-client-3' },
      update: {},
      create: {
        id: 'hub-client-3',
        name: 'Carlos Oliveira',
        document: '111.222.333-44',
        type: 'pf',
        email: 'carlos.oliveira@email.com',
        phone: '(21) 97777-5555',
        officeId: officeHub.id,
      },
    }),
  ]);

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);
  const em15dias = new Date(hoje);
  em15dias.setDate(em15dias.getDate() + 15);
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const processosHub = await Promise.all([
    prisma.process.upsert({
      where: { id: 'hub-process-1' },
      update: {},
      create: {
        id: 'hub-process-1',
        number: '1002345-67.2024.8.26.0100',
        court: '2ª Vara Cível',
        subject: 'Ação de Cobrança',
        causeValue: 85000,
        status: 'ativo',
        parts: 'Maria Santos x Banco XYZ',
        clientId: clientsHub[0].id,
        responsibleId: adminUser.id,
        officeId: officeHub.id,
      },
    }),
    prisma.process.upsert({
      where: { id: 'hub-process-2' },
      update: {},
      create: {
        id: 'hub-process-2',
        number: '2003456-78.2024.8.26.0100',
        court: '3ª Vara da Fazenda Pública',
        subject: 'Mandado de Segurança',
        causeValue: 0,
        status: 'ativo',
        parts: 'Tech Solutions Ltda x Município',
        clientId: clientsHub[1].id,
        responsibleId: adminUser.id,
        officeId: officeHub.id,
      },
    }),
    prisma.process.upsert({
      where: { id: 'hub-process-3' },
      update: {},
      create: {
        id: 'hub-process-3',
        number: '3004567-89.2023.8.26.0100',
        court: '1ª Vara de Família',
        subject: 'Divórcio Consensual',
        causeValue: 0,
        status: 'encerrado',
        parts: 'Carlos Oliveira x Ana Oliveira',
        clientId: clientsHub[2].id,
        responsibleId: adminUser.id,
        officeId: officeHub.id,
      },
    }),
  ]);

  // Timeline do primeiro processo
  await prisma.processEvent.deleteMany({ where: { processId: processosHub[0].id } }).catch(() => {});
  await prisma.processEvent.createMany({
    data: [
      { processId: processosHub[0].id, title: 'Distribuição', description: 'Processo distribuído por sorteio', type: 'movimentacao' },
      { processId: processosHub[0].id, title: 'Citação do réu', description: 'Citação realizada via oficial de justiça', type: 'movimentacao' },
      { processId: processosHub[0].id, title: 'Audiência de Conciliação designada', description: 'Data: próxima semana', type: 'audiência' },
    ],
  });

  // Prazos (admin user)
  await prisma.deadline.deleteMany({ where: { userId: adminUser.id } }).catch(() => {});
  await prisma.deadline.createMany({
    data: [
      { title: 'Contestação - Processo Maria Santos', dueDate: em7dias, type: 'processual', priority: 'urgente', userId: adminUser.id, processId: processosHub[0].id },
      { title: 'Recurso de apelação', dueDate: em15dias, type: 'processual', priority: 'importante', userId: adminUser.id },
      { title: 'Revisão de contrato Tech Solutions', dueDate: amanha, type: 'extrajudicial', priority: 'rotina', userId: adminUser.id, processId: processosHub[1].id },
    ],
  });

  // Audiências (admin user)
  await prisma.hearing.deleteMany({ where: { userId: adminUser.id } }).catch(() => {});
  await prisma.hearing.createMany({
    data: [
      { title: 'Audiência de Conciliação - Maria Santos', date: em7dias, time: '14:00', location: 'Sala 101 - Fórum Central', type: 'Conciliação', userId: adminUser.id, processId: processosHub[0].id, completed: false },
      { title: 'Audiência de Instrução - Tech Solutions', date: ontem, time: '10:00', location: '2ª Vara', type: 'Instrução', userId: adminUser.id, processId: processosHub[1].id, completed: true },
    ],
  });

  // Lançamentos financeiros (Hub Central)
  await prisma.financial.deleteMany({ where: { officeId: officeHub.id } }).catch(() => {});
  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15);
  await prisma.financial.createMany({
    data: [
      { type: 'honorario', description: 'Honorários - Ação de Cobrança (Maria Santos)', value: 8500, date: hoje, officeId: officeHub.id, processId: processosHub[0].id },
      { type: 'honorario', description: 'Parcela contrato mensal - Tech Solutions', value: 3500, date: hoje, officeId: officeHub.id, processId: processosHub[1].id },
      { type: 'receita', description: 'Consulta inicial - Carlos Oliveira', value: 500, date: mesPassado, officeId: officeHub.id },
      { type: 'despesa', description: 'Taxa judicial - Mandado de Segurança', value: 350, date: ontem, officeId: officeHub.id, processId: processosHub[1].id },
      { type: 'despesa', description: 'Despesas de escritório', value: 1200, date: mesPassado, officeId: officeHub.id },
    ],
  });

  console.log('Seed concluído.');
  console.log('Logins:');
  console.log('- demo@advcargo.com.br / 123456');
  console.log('- admin@hubcentral.com / 123456');
  console.log('- vanderson@hubcentral.com / 123456 (dev, apenas logs do sistema)');
  console.log('Hub Central: clientes, processos, prazos, audiências e financeiro preenchidos.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
