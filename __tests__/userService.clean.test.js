const { UserService } = require('../src/userService');

const dadosUsuarioPadrao = {
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: 25,
};

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  const criarUsuarioPadrao = () =>
    userService.createUser(
      dadosUsuarioPadrao.nome,
      dadosUsuarioPadrao.email,
      dadosUsuarioPadrao.idade
    );

  describe('createUser', () => {
    test('retorna o usuário criado com um id gerado', () => {
      const usuario = criarUsuarioPadrao();

      expect(usuario.id).toBeDefined();
    });

    test('cria o usuário com os dados informados e status ativo', () => {
      const usuario = criarUsuarioPadrao();

      expect(usuario).toMatchObject({
        nome: dadosUsuarioPadrao.nome,
        email: dadosUsuarioPadrao.email,
        idade: dadosUsuarioPadrao.idade,
        status: 'ativo',
      });
    });

    test('cria o usuário como não administrador por padrão', () => {
      const usuario = criarUsuarioPadrao();

      expect(usuario.isAdmin).toBe(false);
    });

    test('cria um usuário administrador quando isAdmin é true', () => {
      const usuario = userService.createUser('Admin', 'admin@teste.com', 40, true);

      expect(usuario.isAdmin).toBe(true);
    });

    test('gera ids diferentes para usuários diferentes', () => {
      const primeiro = userService.createUser('Alice', 'alice@email.com', 28);
      const segundo = userService.createUser('Bob', 'bob@email.com', 32);

      expect(primeiro.id).not.toBe(segundo.id);
    });

    test('lança erro ao criar usuário menor de idade', () => {
      const criarMenor = () => userService.createUser('Menor', 'menor@email.com', 17);

      expect(criarMenor).toThrow('O usuário deve ser maior de idade.');
    });

    test('aceita usuário com exatamente 18 anos', () => {
      const criarMaiorDeIdade = () => userService.createUser('Jovem', 'jovem@email.com', 18);

      expect(criarMaiorDeIdade).not.toThrow();
    });

    test.each([
      ['nome', [undefined, 'a@teste.com', 30]],
      ['email', ['Fulano', undefined, 30]],
      ['idade', ['Fulano', 'a@teste.com', undefined]],
    ])('lança erro quando o campo %s não é informado', (_campo, argumentos) => {
      const criarSemCampo = () => userService.createUser(...argumentos);

      expect(criarSemCampo).toThrow('Nome, email e idade são obrigatórios.');
    });

    test('não persiste o usuário quando a validação falha', () => {
      const criarMenor = () => userService.createUser('Menor', 'menor@email.com', 17);
      expect(criarMenor).toThrow();

      const relatorio = userService.generateUserReport();

      expect(relatorio).toContain('Nenhum usuário cadastrado.');
    });
  });

  describe('getUserById', () => {
    test('retorna o usuário previamente criado', () => {
      const usuarioCriado = criarUsuarioPadrao();

      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      expect(usuarioBuscado).toEqual(usuarioCriado);
    });

    test('retorna null quando o id não existe', () => {
      const usuarioBuscado = userService.getUserById('id-inexistente');

      expect(usuarioBuscado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('retorna true ao desativar um usuário comum', () => {
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);

      const resultado = userService.deactivateUser(usuarioComum.id);

      expect(resultado).toBe(true);
    });

    test('altera o status do usuário comum para inativo', () => {
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);

      userService.deactivateUser(usuarioComum.id);

      expect(userService.getUserById(usuarioComum.id).status).toBe('inativo');
    });

    test('retorna false ao tentar desativar um administrador', () => {
      const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      const resultado = userService.deactivateUser(usuarioAdmin.id);

      expect(resultado).toBe(false);
    });

    test('mantém o administrador ativo após a tentativa de desativação', () => {
      const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      userService.deactivateUser(usuarioAdmin.id);

      expect(userService.getUserById(usuarioAdmin.id).status).toBe('ativo');
    });

    test('retorna false quando o usuário não existe', () => {
      const resultado = userService.deactivateUser('id-inexistente');

      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('informa que não há usuários quando nenhum foi cadastrado', () => {
      const relatorio = userService.generateUserReport();

      expect(relatorio).toContain('Nenhum usuário cadastrado.');
    });

    test('inclui o título do relatório', () => {
      userService.createUser('Alice', 'alice@email.com', 28);

      const relatorio = userService.generateUserReport();

      expect(relatorio).toContain('Relatório de Usuários');
    });

    test('inclui id, nome e status de cada usuário cadastrado', () => {
      const alice = userService.createUser('Alice', 'alice@email.com', 28);
      const bob = userService.createUser('Bob', 'bob@email.com', 32);

      const relatorio = userService.generateUserReport();

      expect(relatorio).toEqual(expect.stringContaining(alice.id));
      expect(relatorio).toEqual(expect.stringContaining('Alice'));
      expect(relatorio).toEqual(expect.stringContaining(bob.id));
      expect(relatorio).toEqual(expect.stringContaining('Bob'));
    });

    test('reflete o status inativo de um usuário desativado', () => {
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);
      userService.deactivateUser(usuarioComum.id);

      const relatorio = userService.generateUserReport();

      expect(relatorio).toContain('inativo');
    });

    test('não exibe a mensagem de lista vazia quando há usuários', () => {
      userService.createUser('Alice', 'alice@email.com', 28);

      const relatorio = userService.generateUserReport();

      expect(relatorio).not.toContain('Nenhum usuário cadastrado.');
    });
  });
});
