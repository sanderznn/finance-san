# SAN Finance

Aplicativo pessoal em português, com armazenamento local no navegador. A versão atual mantém a chave `sanFinancePro_v6_fixas` e não envia lançamentos ao GitHub.

## Uso

- Em Configurações, configure os valores previstos dos salários dos dias 5 e 20.
- Em Configurações → Recebimentos, registre cada salário quando acontecer. Se já o lançou manualmente, remova o lançamento duplicado antes de registrar pelo planejamento.
- Abra uma conta e toque em Editar para alterar nome, valor e vencimento. Valores já pagos são preservados; a lista prioriza pendentes, depois pagas, futuras e quitadas.
- A aba Dívidas mantém uma única lista de contas, com valor, vencimento, parcelas e status pago/pendente. Faturas são gerenciadas na aba Cartões.
- Em Dívidas, use Todas, Dia 5 ou Dia 20 para filtrar pelo vencimento. O resumo acompanha o filtro; saldo e projeções gerais continuam considerando todas as contas.
- Ao pagar contas, faturas ou receber jobs, informe a data real. O mês do evento ou do vencimento não determina o mês de caixa.
- Saldo acumulado inclui entradas e saídas dos meses anteriores. Confira o total em Configurações → Conferir saldo real se seu histórico anterior estiver incompleto.
- Metas representam dinheiro já incluído no saldo total. Esse valor fica separado do disponível para gastar; retirar uma reserva apenas libera o valor, sem criar entrada de dinheiro.
- Cartões só liberam limite após o pagamento registrado. Parcelas distribuem os centavos sem perder diferença. Compras de faturas já pagas precisam ter o pagamento desmarcado antes de serem alteradas.

## Atualização e recuperação

Em **Configurações → Backup e recuperação**, baixe um arquivo JSON e salve-o em Arquivos ou iCloud Drive. A tela registra quando o arquivo foi gerado e avisa quando houver novas alterações. Esse horário indica geração, não confirma que o arquivo foi salvo pelo navegador.

Após uma alteração, o aviso **Desfazer** fica visível por dez segundos; a mesma ação continua disponível em Configurações e depois de reabrir o app. É possível desfazer **uma alteração por vez**, com **Refazer** para reverter o desfazimento. Uma nova alteração substitui essa possibilidade. Operações vinculadas, como custo de job e saída financeira ou pagamento e fatura, são recuperadas juntas.

Ao restaurar um arquivo ou uma cópia local, confira a quantidade de registros antes de confirmar a substituição. A restauração e a limpeza preservam os dados anteriores em `sanFinancePro_v6_fixas_beforeImport` e também podem ser desfeitas quando os dados anteriores são válidos. **Mais opções de recuperação** dá acesso às cópias locais disponíveis. Arquivos antigos com os dados diretamente na raiz continuam compatíveis.

`sanFinancePro_v6_fixas_previous` aceita a cópia antiga sem envelope e agora guarda `{kind, version, revision, at, label, mode, data}`. A revisão `_sanRevision` liga o desfazimento à gravação correspondente. Abrir o app, trocar filtros e salvar sem mudanças não substituem essa cópia. Falhas de gravação preservam o estado confirmado; alterações detectadas em outra aba são carregadas antes de permitir uma nova tentativa. A cópia anterior à migração continua em `sanFinancePro_v6_fixas_beforeV7`.

Dados inválidos bloqueiam gravações automáticas. Nessa situação, baixar o backup preserva o conteúdo original em vez de gerar uma cópia vazia. Restaure uma cópia válida; o conteúdo ilegível anterior fica disponível para download. As cópias locais ficam no mesmo navegador e podem desaparecer se seus dados forem apagados. Elas não substituem um arquivo salvo fora do app. Nenhuma sincronização com outro dispositivo é oferecida.

Pagamentos antigos de dívidas sem data registrada mantêm o mês de vencimento como referência, pois não é possível inferir a data real. Jobs antigos sem data de recebimento usam o mês do evento como fallback. Novos pagamentos registram a data informada.

## Código e testes

`index.html` é a interface e contém os controladores ativos. `finance-core.js` concentra cálculos em centavos; `recovery-store.js` cuida da gravação e da recuperação de uma alteração, com armazenamento injetável para testes. `script1.js` a `script4.js` são cópias dos blocos inline para consulta, não são carregados pela página. Ao editar controladores, atualize essas cópias.

Execute com Node.js:

```
node finance-core.test.cjs
node recovery-store.test.cjs
node app.test.cjs
```

Os testes cobrem saldo acumulado, datas, centavos, cartões, atrasos, reservas, salários, filtros por vencimento, desfazer/refazer após reabrir, recuperação de vínculos, prévia e cancelamento da importação, exportação e restauração do JSON, arquivos inválidos, conflito entre abas, falhas de leitura e gravação e preservação dos dados corrompidos. O teste dos controladores usa uma simulação do DOM, não valida layout, Safari ou interação real de toque. É necessário conferir a atualização no aparelho.

## Dashboard

Mostra entradas e saídas registradas, resultado do mês (não o saldo acumulado), até quatro grupos de categorias de saídas e histórico dos últimos seis meses. Faturas aparecem como saídas no pagamento, sem duplicar compras. A comparação usa o mês anterior inteiro; no mês atual ela é identificada como parcial. Histórico e calendário ficam recolhidos.
