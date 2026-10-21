# SAN Finance

Aplicativo pessoal em português, com armazenamento local no navegador. A versão atual mantém a chave `sanFinancePro_v6_fixas` e não envia lançamentos ao GitHub.

## Uso

- Em Configurações, configure os valores previstos dos salários dos dias 5 e 20.
- Em Configurações → Recebimentos, registre cada salário quando acontecer. Se já o lançou manualmente, remova o lançamento duplicado antes de registrar pelo planejamento.
- A aba Dívidas mantém uma única lista de contas, com valor, vencimento, parcelas e status pago/pendente. Faturas são gerenciadas na aba Cartões.
- Ao pagar contas, faturas ou receber jobs, informe a data real. O mês do evento ou do vencimento não determina o mês de caixa.
- Saldo acumulado inclui entradas e saídas dos meses anteriores. Confira o total em Configurações → Conferir saldo real se seu histórico anterior estiver incompleto.
- Metas representam dinheiro já incluído no saldo total. Esse valor fica separado do disponível para gastar; retirar uma reserva apenas libera o valor, sem criar entrada de dinheiro.
- Cartões só liberam limite após o pagamento registrado. Parcelas distribuem os centavos sem perder diferença. Compras de faturas já pagas precisam ter o pagamento desmarcado antes de serem alteradas.

## Atualização e recuperação

Exporte um backup JSON antes da atualização. Uma cópia local anterior à migração é preservada em `sanFinancePro_v6_fixas_beforeV7`. Importações preservam os dados anteriores em `_beforeImport`; gravações mantêm uma cópia em `_previous`. Essas cópias ficam no mesmo navegador e não substituem um backup baixado.

Dados inválidos bloqueiam gravações automáticas. Em Configurações, baixe os dados originais e importe um backup válido. Nenhuma sincronização com outro dispositivo é oferecida.

Pagamentos antigos de dívidas sem data registrada mantêm o mês de vencimento como referência, pois não é possível inferir a data real. Jobs antigos sem data de recebimento usam o mês do evento como fallback. Novos pagamentos registram a data informada.

## Código e testes

`index.html` é a interface e contém os controladores ativos. `finance-core.js` concentra cálculos em centavos e não depende do navegador. `script1.js` a `script4.js` são cópias dos blocos inline para consulta, não são carregados pela página. Ao editar controladores, atualize essas cópias.

Execute com Node.js:

```
node finance-core.test.cjs
node app.test.cjs
```

Os testes cobrem saldo acumulado, datas de recebimento/pagamento, centavos, cartão sem pagamento, diferença de fatura, atrasos, reservas, recebimento de salário sem duplicação, restauração e bloqueio de dados corrompidos. O teste dos controladores usa uma simulação mínima do DOM, não valida layout, Safari ou interação real de toque. É necessário conferir a atualização no aparelho.
