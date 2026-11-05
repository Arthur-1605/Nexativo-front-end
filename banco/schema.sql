-- ============================================================
-- Nexativo - esquema completo do banco de dados (instalação nova)
-- Para bancos já existentes, use migracao.sql.
-- ============================================================

CREATE DATABASE IF NOT EXISTS projeto_integrador
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE projeto_integrador;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    setor VARCHAR(100) NOT NULL DEFAULT 'Atendimento',
    perfil VARCHAR(30) NOT NULL DEFAULT 'Usuário',
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone VARCHAR(16) NOT NULL DEFAULT '📍',
    status VARCHAR(10) NOT NULL DEFAULT 'Ativa'
);

CREATE TABLE equipes (
    id_equipe INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especialidade VARCHAR(100) NOT NULL
);

CREATE TABLE ocorrencias (
    id_ocorrencia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL,
    id_categoria INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Aberta',
    responsavel VARCHAR(100) NULL,
    prazo DATE NULL,
    orcamento_estimado DECIMAL(12,2) NOT NULL DEFAULT 0,
    orcamento_aprovado DECIMAL(12,2) NOT NULL DEFAULT 0,
    orcamento_gasto DECIMAL(12,2) NOT NULL DEFAULT 0,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_resolucao DATETIME NULL,
    observacao_ia TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE localizacoes (
    id_localizacao INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE
);

CREATE TABLE historico_ocorrencias (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    id_usuario INT NULL,
    status_anterior VARCHAR(30),
    novo_status VARCHAR(30) NOT NULL,
    observacao TEXT,
    data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE observacoes_ocorrencia (
    id_observacao INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    id_usuario INT NULL,
    texto TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE TABLE tarefas_ocorrencia (
    id_tarefa INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    concluida TINYINT(1) NOT NULL DEFAULT 0,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE
);

CREATE TABLE atendimentos (
    id_atendimento INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    id_equipe INT NOT NULL,
    data_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_fim DATETIME NULL,
    observacao TEXT,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE,
    FOREIGN KEY (id_equipe) REFERENCES equipes(id_equipe)
);

CREATE TABLE notificacoes (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_ocorrencia INT NOT NULL,
    mensagem TEXT NOT NULL,
    lida TINYINT(1) DEFAULT 0,
    data_notificacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE
);

CREATE TABLE anexos (
    id_anexo INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL,
    data_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE
);

CREATE TABLE mensagens_chat (
    id_mensagem BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    canal VARCHAR(40) NOT NULL DEFAULT 'geral',
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_chat_canal_data (canal, data_envio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notas (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Manual',
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE preferencias_usuarios (
    id_usuario INT PRIMARY KEY,
    notificacoes TINYINT(1) NOT NULL DEFAULT 1,
    alertas_urgentes TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- ============================================================
-- Dados iniciais
-- ============================================================

INSERT INTO usuarios (nome, email, senha, cargo, setor, perfil, status) VALUES
('João Silva', 'joao@email.com', '123456', 'Funcionário', 'Atendimento', 'Usuário', 'Ativo'),
('Adm', 'adm@admin.com', 'adm123', 'Administrador', 'Administração', 'Administrador', 'Ativo'),
('Carlos Oliveira', 'carlos@email.com', '123456', 'Funcionário', 'Atendimento', 'Usuário', 'Ativo'),
('Ana Santos', 'ana@email.com', '123456', 'Funcionário', 'Atendimento', 'Usuário', 'Ativo');

INSERT INTO categorias (nome, descricao, icone, status) VALUES
('Pavimentação', 'Problemas relacionados a ruas, estradas e calçadas', '🕳️', 'Ativa'),
('Iluminação', 'Problemas relacionados à iluminação pública', '💡', 'Ativa'),
('Saneamento', 'Problemas relacionados à água e esgoto', '💧', 'Ativa'),
('Estrutura', 'Problemas em pontes, viadutos e estruturas', '🚧', 'Ativa'),
('Construção', 'Problemas relacionados a obras e construções', '🏗️', 'Ativa'),
('Segurança', 'Situações que apresentam risco para a população', '📍', 'Ativa');

INSERT INTO equipes (nome, especialidade) VALUES
('Equipe de Pavimentação', 'Obras viárias'),
('Equipe Elétrica', 'Iluminação pública'),
('Equipe Hidráulica', 'Saneamento'),
('Equipe de Estruturas', 'Pontes e estruturas'),
('Equipe de Construção', 'Construção civil');

INSERT INTO ocorrencias
(id_usuario, id_categoria, titulo, descricao, prioridade, status, responsavel, observacao_ia) VALUES
(1, 1, 'Buraco na pista', 'Grande buraco localizado próximo a uma escola.', 'Alta', 'Aberta', NULL,
'A IA identificou uma situação de risco para veículos e pedestres devido à localização.'),
(2, 2, 'Poste sem iluminação', 'Poste localizado na rua principal está sem iluminação.', 'Média', 'Em análise', 'Equipe Elétrica',
'A ocorrência apresenta impacto na segurança e visibilidade da região.'),
(3, 3, 'Vazamento de água', 'Há um vazamento de água próximo a uma residência.', 'Alta', 'Aberta', NULL,
'A IA classificou como prioridade alta devido ao desperdício de água e possível dano à infraestrutura.'),
(4, 4, 'Esgoto', 'Há um vazamento de esgoto próximo a um hospital.', 'Alta', 'Aberta', NULL,
'A IA classificou como prioridade alta devido a possível dano à infraestrutura.');

INSERT INTO localizacoes
(id_ocorrencia, endereco, bairro, cidade, latitude, longitude) VALUES
(1, 'Rua João Silva, 150', 'Centro', 'Criciúma', -28.6775, -49.3697),
(2, 'Rua das Flores, 300', 'Santa Bárbara', 'Criciúma', -28.6785, -49.3650),
(3, 'Avenida Principal, 500', 'Próspera', 'Criciúma', -28.6720, -49.3500),
(4, 'Rua Raposo Távares, 235', 'Santa Catarina', 'Criciúma', -28.7420, -49.3400);

INSERT INTO historico_ocorrencias
(id_ocorrencia, id_usuario, status_anterior, novo_status, observacao) VALUES
(1, 1, NULL, 'Aberta', 'Ocorrência registrada pelo funcionário.'),
(2, 3, NULL, 'Aberta', 'Ocorrência registrada pelo funcionário.'),
(2, 2, 'Aberta', 'Em análise', 'Administrador iniciou a análise da ocorrência.'),
(3, 4, NULL, 'Aberta', 'Ocorrência registrada pelo funcionário.');

INSERT INTO atendimentos (id_ocorrencia, id_equipe, observacao) VALUES
(2, 2, 'Equipe elétrica deverá verificar o poste.');

INSERT INTO notificacoes (id_usuario, id_ocorrencia, mensagem) VALUES
(2, 1, 'Nova ocorrência de alta prioridade registrada.'),
(2, 2, 'A ocorrência de iluminação está aguardando análise.'),
(2, 3, 'Nova ocorrência de alta prioridade registrada.');

INSERT INTO anexos (id_ocorrencia, nome_arquivo, caminho_arquivo) VALUES
(1, 'buraco.jpg', '/uploads/buraco.jpg'),
(2, 'poste.jpg', '/uploads/poste.jpg'),
(3, 'vazamento.jpg', '/uploads/vazamento.jpg');

INSERT INTO preferencias_usuarios (id_usuario, notificacoes, alertas_urgentes) VALUES
(1, 1, 1), (2, 1, 1), (3, 1, 1), (4, 1, 1);
