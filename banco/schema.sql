CREATE DATABASE projeto_integrador;
USE projeto_integrador;
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);
CREATE TABLE equipes (
    id_equipe INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especialidade VARCHAR(100) NOT NULL
);
CREATE TABLE ocorrencias (
    id_ocorrencia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Aberta',
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_resolucao DATETIME NULL,
    observacao_ia TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
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
    id_usuario INT NOT NULL,
    status_anterior VARCHAR(30),
    novo_status VARCHAR(30) NOT NULL,
    observacao TEXT,
    data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
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
USE projeto_integrador;

CREATE TABLE IF NOT EXISTS mensagens_chat (
    id_mensagem INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    canal VARCHAR(40) NOT NULL DEFAULT 'geral',
    mensagem TEXT NOT NULL,
    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    INDEX idx_chat_canal_data (canal, data_envio)
);
 
CREATE TABLE notas (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Manual',
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE);
INSERT INTO usuarios (nome, email, senha, cargo) VALUES
('João Silva', 'joao@email.com', '123456', 'Funcionário'),
('Adm', 'adm@admin.com', 'adm123', 'Administrador'),
('Carlos Oliveira', 'carlos@email.com', '123456', 'Funcionário'),
('Ana Santos', 'ana@email.com', '123456', 'Funcionário');
INSERT INTO categorias (nome, descricao) VALUES
('Pavimentação', 'Problemas relacionados a ruas, estradas e calçadas'),
('Iluminação', 'Problemas relacionados à iluminação pública'),
('Saneamento', 'Problemas relacionados à água e esgoto'),
('Estrutura', 'Problemas em pontes, viadutos e estruturas'),
('Construção', 'Problemas relacionados a obras e construções'),
('Segurança', 'Situações que apresentam risco para a população');
INSERT INTO equipes (nome, especialidade) VALUES
('Equipe de Pavimentação', 'Obras viárias'),
('Equipe Elétrica', 'Iluminação pública'),
('Equipe Hidráulica', 'Saneamento'),
('Equipe de Estruturas', 'Pontes e estruturas'),
('Equipe de Construção', 'Construção civil');
INSERT INTO ocorrencias
(id_usuario, id_categoria, titulo, descricao, prioridade, status, observacao_ia) VALUES
(1, 1, 'Buraco na pista', 'Grande buraco localizado próximo a uma escola.', 'Alta', 'Aberta',
'A IA identificou uma situação de risco para veículos e pedestres devido à localização.'),
(2, 2, 'Poste sem iluminação', 'Poste localizado na rua principal está sem iluminação.', 'Média', 'Em análise',
'A ocorrência apresenta impacto na segurança e visibilidade da região.'),
(3, 3, 'Vazamento de água', 'Há um vazamento de água próximo a uma residência.', 'Alta', 'Aberta',
'A IA classificou como prioridade alta devido ao desperdício de água e possível dano à infraestrutura.'),
(4, 4, 'Esgoto', 'Há um vazamento de esgoto próximo a um hospital.', 'Alta', 'Aberta',
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
INSERT INTO atendimentos
(id_ocorrencia, id_equipe, observacao) VALUES
(1, 1, 'Equipe de pavimentação será responsável pela avaliação do problema.'),
(2, 2, 'Equipe elétrica deverá verificar o poste.'),
(3, 3, 'Equipe hidráulica deverá verificar o vazamento.');
INSERT INTO notificacoes
(id_usuario, id_ocorrencia, mensagem) VALUES
(2, 1, 'Nova ocorrência de alta prioridade registrada.'),
(2, 2, 'A ocorrência de iluminação está aguardando análise.'),
(2, 3, 'Nova ocorrência de alta prioridade registrada.');
INSERT INTO anexos
(id_ocorrencia, nome_arquivo, caminho_arquivo) VALUES
(1, 'buraco.jpg', '/uploads/buraco.jpg'),
(2, 'poste.jpg', '/uploads/poste.jpg'),
(3, 'vazamento.jpg', '/uploads/vazamento.jpg');