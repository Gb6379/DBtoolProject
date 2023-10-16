Ferramente desenvolvida visando a automatizacao para geracao de dlls de bando, querys de insercao de dados e estruturacao de projeto a partir da arquitetura hexagonal.
[![N|Solid](https://cldup.com/dTxpPi9lDf.thumb.png)](https://nodesource.com/products/nsolid)

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

##para rodar o projeto:

1 - node version 18.18.2 +

2 - ter sql server instalado

3 - abrir o arquivo .env.example e criar um arquivo ".env" com as variaveis e setar suas credencias de banco no "Credencias banco 2"

4 - ter uma banco sql server populado

5 - rodar npm i

6 - npm run start:dev (rodar local) - docker compose -f docker-compose.yml --env-file=.env up(rodar pelo docker)

ps: caso a escolha seja rodar pelo docker, e estiver em abiente windows, baixar o docker dektop e configurar o wsl2 no windows.

ps: no arquivo .env setar as variaveis do seu banco, no 'CREDENCIAIS BANCO 2'. Para testar a funcionalidade explicada no video. 

##Desriçao do projeto: Projeto:

Projeto foi desenvolvido para facilitar a migracao de dados entre databases. 

