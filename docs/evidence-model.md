# DealMesh evidence model

## Evidence boundary

V1 adjudicates no external real-world fact. There is no web fetch, arbitrary
URL, price oracle, identity oracle, delivery proof, document attachment, or
backend-supplied evidence in the authoritative path.

The complete evidence envelope is the exact on-chain participant-authored
data:

- authenticated sender address for each write;
- Party A address and nominated Party B address;
- Party A's immutable bounded requirements, maximum price, latest deadline,
  price unit, and action digest;
- Party B's immutable bounded requirements, minimum price, earliest deadline,
  and price unit;
- the exact bounded offer submitted by one of the two parties; and
- canonical hashes, assessment result, and transaction/finality references.

The wallet signature authenticates who committed data. Canonicalization and
hashes bind which bytes and fields were committed. Schema and bounds checks
make the envelope admissible. Consensus only proves that validators agreed
about the bounded interpretation; it does not authenticate evidence or make
the terms legally binding.

## Trust order

DealMesh uses this order and does not skip a layer:

1. sender authentication;
2. canonicalization;
3. content integrity and hash binding;
4. schema and bounds validation;
5. deterministic admissibility;
6. semantic adjudication;
7. validator consensus;
8. native finality; and
9. exact `BOUND` authorization.

The frontend may format and display inputs but it is not in this trust chain
as a decision maker. A backend, indexer, or client LLM may assist with UX but
cannot write a verdict or authorize a different digest.

## What validators see

Every leader and validator receives the same canonical, bounded values. Text
is data, not instructions. The prompt uses fixed labels and delimiters and
states that text inside those delimiters may contain adversarial instructions
that must be ignored.

The semantic call does not receive wallet private data, private keys, hidden
backend notes, external URLs, or uncommitted counterterms. It receives no
permission to execute an action. It returns no reasoning that affects state.

## Integrity and hashes

`deal_id` binds the initial A-authored deal payload. Separate constraint
digests bind each party's immutable constraint set. `offer_digest` binds the
deal ID, typed price, typed deadline, exact action digest, and canonical
ordered terms. The downstream authorization key is the exact pair
`(deal_id, offer_digest)`.

Hashes are not secrets and do not provide privacy. Plain participant text is
on-chain evidence in the planned design. Anyone reading the contract can
verify the stored canonical fields and recompute the digests.

## Evidence that is intentionally absent

DealMesh does not claim that:

- a named party is a real-world legal entity;
- a price is fair or payable;
- a deadline will be met;
- an action digest corresponds to a safe action;
- requirements are non-discriminatory or legally enforceable; or
- a semantic `MATCH` guarantees successful execution.

Those would require additional evidence and governance that are outside the
locked V1 scope.
