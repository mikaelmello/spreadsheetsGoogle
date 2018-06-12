# Visualização de Dados das Eleições 2018

[![npm](https://img.shields.io/npm/v/npm.svg?style=flat-square)](https://www.npmjs.com/package/npm) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/your/your-project/blob/master/LICENSE)

![Spreadsheet](https://i.imgur.com/1nWhycw.png)

Este repositório compõe projeto de pesquisa com foco empírico nas eleições brasileiras de 2018 do grupo de pesquisa [Resocie](http://resocie.org) do [Instituto de Ciência Política - IPOL](http://ipol.unb.br/) com o apoio técnico do [Departamento de Computação - CIC](http://www.cic.unb.br/) da [Universidade de Brasília - UnB](http://unb.br).

O projeto consiste na coleta sistemática de informações quantitativas de diferentes plataformas com o objetivo de subsidiar a análise do comportamento político de alguns atores da cena eleitoral durante o período de campanha. Além de seu objetivo finalístico para a coleta de dados, o projeto tem também por intuito servir de material de estudo dos alunos da disciplina Engenharia de Software do Departamento de Ciência da Computação da UnB no 1º semestre de 2018. 

As instruções a seguir trazem orientações para aqueles que quiserem contribuir com a iniciativa.

## Pré-requisitos

Seu sistema precisa ter [Node.js](https://nodejs.org/en/download/package-manager/) v9.x (preferencialmente) ou v8.x (mínimo) e npm instalados. 

O projeto utiliza a biblioteca [chartjs-node](https://github.com/vmpowerio/chartjs-node), que requer a instalação da biblioteca Cairo em seu sistema, guias de como instalar podem ser encontrados [clicando aqui](https://cairographics.org/download/).

Também é necessário que seu sistema possua MongoDB instalado, instruções de como instalá-lo podem ser encontradas no site [Install MongoDB](https://docs.mongodb.com/manual/installation/).

Uma parte do projeto (visualização de planilhas Google) precisa de uma chave de autenticação para usar a Google API. Para conseguir as credenciais, acesse o [Console de Desenvolvedores](https://console.developer.google.com/). Selecione o projeto do grupo `resocie-data-viz`, clique em *APIs & auth* e em seguida em *credentials*, e crie sua credencial ou escolha uma existente.

Mais informações de como funciona a autenticação em Oauth2 das APIs do Google podem ser encontradas no seguinte link:

[Google API Node JS Client](https://github.com/google/google-api-nodejs-client#authorizing-and-authenticating)

## Instalação

Garanta que todos os [pré-requisitos](#pré-requisitos) foram completados

O primeiro passo para executar o código deste repositório consiste em clona-lo localmente.

```shell
git clone https://github.com/unb-cic-esw/data-viz.git
```

Logo após, precisamos instalar as dependências do projeto. No seu terminal, 
digite o seguinte comando:

```shell
npm install
```

Entre na página de credencials no painel da Google API e baixe a credencial de sua escolha, salve-a na pasta `config` como `credentials.json`.

Renomeie o arquivo de configurações `.env.example` para `.env`, executando `mv .env.example .env`, abra-o e altere os dados preenchendo com as configurações de sua máquina.

```
# Ambiente de desenvolvimento
# Aconselhado: development
NODE_ENV=<env>

# Porta do servidor
# Aconselhado: port={0, 65536}
PORT=port

# Host do servidor de MongoDB
# 'data-viz' é o nome do banco de dados
MONGO_HOST=mongodb://localhost/data-viz

# Porta aberta pelo servidor Mongo
# Default pelo MongoDB: 27017
# Verificar a porta utilizada
MONGO_PORT=portMDB

```

Após a instalação das dependências, a escrita do arquivo de credenciais e o de configurações execute o projeto com:

```shell
npm start
```

O projeto estará rodando em

```shell
http://localhost:3000
```

Ou na porta definida em `.env`: `PORT=port`.

### Ubuntu
Caso esteja usando o Ubuntu, há alguns detalhes que devem ser chamados à atenção:

#### Biblioteca Cairo
Para instalar a biblioteca Cairo é preciso instalar as suas dependências. Por isso, deve-se executar este comando:

```
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
```

#### NodeJS
Para instalar o NodeJS a partir do NVM (Node Version Manager), método aconselhado, basta seguir os passos listados a seguir. Para mais detalhes, pode-se acessar o [Digital Ocean](https://www.digitalocean.com/community/tutorials/como-instalar-o-node-js-no-ubuntu-16-04-pt).

```
$ sudo apt-get update
$ sudo apt-get install build-essential libssl-dev
$ curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh -o install_nvm.sh
$ bash install_nvm.sh
```

Reinicie a seção de usuário e continue, sabendo que `<versão>` corresponde à sua versão de escolha de instalação (exatamente na forma que aparecer):

```
$ nvm ls-remote
$ nvm install <versão>
$ nvm use <versão>
```

#### MongoDB
Para instalar o MongoDB, por este método aconselhado, basta seguir os passos listados a seguir. Para mais detalhes, pode-se acessar o [Digital Ocean](https://www.digitalocean.com/community/tutorials/como-instalar-o-mongodb-no-ubuntu-16-04-pt)

```
$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
$ echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
$ sudo apt-get update
$ sudo apt-get install -y mongodb-org
$ sudo nano /etc/systemd/system/mongodb.service
```

Cole este conteúdo no documento:

```
[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target

[Service]
User=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

[Install]
WantedBy=multi-user.target
```

Com esta instalação é possível solicitar alguns serviços:
* Iniciar o serviço: `sudo service mongod start`;
* Reiniciar o serviço: `sudo service mongod restart`;
* Pausar o serviço: `sudo service mongod stop`;
* Verificar o status do serviço: `sudo service mongod status`.

## Desenvolvimento

### Ferramentas

Este projeto usa principalmente, mas não exclusivamente:

* Javascript ES2017
* Node.js
* Mongoose/MongoDB
* Express.js
* googleapis
* Chart.js

## Versionamento

Sugere-se usar o [SemVer](http://semver.org/) para o versionamento do código.
A versão atual é 1.0.0

## Testes

O projeto utiliza a biblioteca [Jest](https://facebook.github.io/jest/) para executar testes. O seguinte comando roda os testes de caso implementados:

```shell
npm test
```

## Guia de estilo

O código conta com a biblioteca [Eslint](https://eslint.org/), com as configurações presentes no arquivo *".eslintrc.js"* para manter boas práticas de programação, extendidas do [Guia de Estilo para Javascript da Airbnb](https://github.com/airbnb/javascript) com algumas mudanças de acordo com as necessidades do nosso projeto. 

Para executar o linter:

```shell
npm run lint
```
É sempre bom usar um plugin no seu editor de texto para ter um feedback em tempo real do código que você escreve, evitando perder tempo reescrevendo muitos trechos de código. No caso do Visual Studio Code, o próprio ESLint oferece um plugin.

## Hooks

Este projeto conta com apenas um hook de pré-commit, isso significa o comando `npm run lint && npm run test` é executado antes de todo commit feito, garantindo que nenhum commit seja realizado com código mal-estilizado ou com testes falhando.

## Documentação

Este projeto usa a biblioteca [JSDoc](https://github.com/jsdoc3/jsdoc) para gerar a documentação automaticamente. 

Para instalar globalmente o JSDoc, execute o seguinte comando:

```shell
npm install -g jsdoc
```

Para instalar localmente,

```shell
npm install --save-dev jsdoc
```

A documentação corrente do projeto já está presente na pasta */docs*, bastando que se abra o arquivo *index.html* para acessar a documentação do projeto.

Para gerar a documentação de um arquivo, execute o seguinte comando:

```shell
jsdoc index.js -d docs
```

Este comando gerará a documentação para o arquivo index.js na pasta */docs*.

## To-do

* Expandir quantidade dos dados utilizados
* Pesar o custo de gerar gráficos server-side e verificar se vale a pena fazê-lo no cliente
* Implementar mecanismo para automatização da coleta recorrente dos dados
* Disponibilizar uma API publica para que leigos possam gerar visualizações interessantes
* Google Spreadsheets vs MongoDB?
* Ignorar os docs no repositório já que eles são gerados automaticamente? Discutir

## Licença

Código disponível sob [Licença MIT](LICENSE)
