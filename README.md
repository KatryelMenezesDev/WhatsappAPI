# WhatsappApi

<p align="center">
  <img src="https://i.imgur.com/LrgydoM.jpeg" alt="Imagem" />
</p>

**WhatsappApi** é uma aplicação moderna que oferece uma API para gerenciar múltiplos números do WhatsApp de forma integrada e eficiente. Com ela, você pode realizar diversas operações relacionadas ao envio de mensagens e gerenciamento de instâncias de números do WhatsApp.  

## Funcionalidades Principais  

- **Adicionar múltiplos números de WhatsApp**: Cadastre e gerencie diversas instâncias para diferentes números.  
- **Envio de mensagens personalizado**: Escolha a instância desejada, forneça o número do destinatário e o texto da mensagem para enviar diretamente pela API.  
- **Listagem de instâncias**: Obtenha uma visão geral de todas as instâncias cadastradas, incluindo seus QR Codes para autenticação.  
- **Visualização de instância específica**: Consulte informações detalhadas de uma instância específica, incluindo seu QR Code.  
- **Exclusão de instâncias**: Remova instâncias desnecessárias de forma rápida e segura.  
- **Geração de QR Code**: Retorne o QR Code para autenticação de cada instância, facilitando o vínculo com o WhatsApp Web.  
- **Registro de logs**: Salve logs de mensagens enviadas em um banco de dados SQLite para auditoria e análise.  
- **Autenticação baseada em Token JWT**: A API utiliza autenticação via `Bearer Token`, que é validado com uma `secret_key` configurada no arquivo `.env`.  

## Objetivo do Projeto  

Proporcionar uma solução simples e escalável para o gerenciamento de múltiplos números do WhatsApp, permitindo integração com outras aplicações para automatização de mensagens e gerenciamento de comunicação.  

## Casos de Uso  

- **Empresas**: Atendimento ao cliente utilizando múltiplos números de WhatsApp.  
- **Automação**: Envio de mensagens em larga escala de maneira organizada.  
- **Gerenciamento Centralizado**: Controle de instâncias do WhatsApp para diferentes serviços ou departamentos.  

Essa API é projetada para ser fácil de usar e altamente customizável, garantindo flexibilidade para diversas aplicações.  

---

⚠️ **Aviso:** Este projeto é para fins educacionais ou de uso interno. O uso indevido ou não autorizado pode violar os Termos de Serviço do WhatsApp.  

---

## Instalação e Configuração  

1. **Certifique-se de que o Node.js esteja instalado em sua máquina**  
   Você pode baixar e instalar o Node.js a partir do site oficial: [https://nodejs.org](https://nodejs.org).  

2. **Clone este repositório**  
   ```bash
   git clone https://github.com/seu-usuario/WhatsappApi.git
   cd WhatsappApi

3. **Instale as dependências**  
   ```bash
   npm install

4. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:

5. **Inicie o ambiente de desenvolvimento** 
   npm run dev

6. **Compilação e uso em produção**  
   Compile o projeto e inicie o servidor em produção:
   ```bash
   npm run build
   npm start