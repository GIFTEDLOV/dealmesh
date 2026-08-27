# DealMesh evidence model

Access date: 2026-08-27 (Africa/Lagos).

## One admissible evidence class

V1 adjudicates no external real-world fact. The only evidence is the exact
participant-authored, wallet-authenticated on-chain envelope:

- native sender address for each write;
- Party A and nominated Party B addresses;
- immutable A requirements, price maximum, latest deadline, price unit, and action digest;
- immutable B requirements, price minimum, earliest deadline, and matching price unit;
- one exact offer with typed price, deadline, action digest, and ordered terms; and
- contract-computed commitment, offer, assessment, binding-request, and agreement digests.

This proves who committed which bytes. It does not prove identity outside the
wallet, truth, fairness, safety, or legal enforceability.

## Admission pipeline

    sender authentication
      -> canonicalization and exact UTF-8 encoding
      -> content integrity and SHA-256 binding
      -> schema, collection, and bounds validation
      -> deterministic admissibility and exact action equality
      -> bounded semantic adjudication
      -> independent validator consensus
      -> finalized assessment callback
      -> exact non-submitter binding request
      -> finalized binding callback
      -> finalized-state BOUND authorization

Every authorization-relevant step is contract-owned. The frontend may format
and preflight values for usability, but it is not evidence and cannot decide
the verdict.

## Canonical integrity

Text is NFC-normalized, CRLF/CR becomes LF, and UTF-8 byte lengths—not
character counts—are bounded. NUL, leading/trailing whitespace, URL schemes,
://, and www. references are rejected. Terms are a JSON list of 1..8 unique,
strictly increasing lowercase keys and canonical values. Duplicate JSON keys
are rejected. Hashes are lowercase fixed-size SHA-256 strings.

Versioned length-prefixed encodings bind fixed field order. The deal ID binds
A, B, A's commitments, action digest, and A's creator nonce. A/B commitment
digests bind each exact constraint set. The offer digest binds deal ID, price,
deadline, action digest, and ordered terms. The agreement digest binds only
the exact deal ID and offer digest.

## Semantic boundary

Only stored canonical values enter the fixed prompt. Requirement and term text
is delimited as untrusted data, including prompt-injection text. No web or
external evidence is used. Validators answer only whether the exact offer
satisfies both requirement sets and return the exact enum MATCH, NO_MATCH, or
INCONCLUSIVE.

The strict parser accepts one JSON object, exactly one key named verdict, and
one exact enum string. It rejects malformed JSON, duplicate keys, markdown,
extra keys, trailing data, wrong types, and casing variants. Parser/model
failures are technical failures. INCONCLUSIVE is a valid consensus result
only when the input is otherwise admissible and the bounded text is
substantively insufficient or ambiguous.

## Finality evidence

Consensus is not finality. The assessment parent stores a provisional result;
an internal emit(on="finalized") callback is the only path to the finalized
assessment state. bind_match then stores a pending request; its finalized-only
callback is the only path to BOUND. The frontend and downstream consumer must
read the latest-final state variant and verify callback execution. A
latest-nonfinal read, ACCEPTED status, frontend boolean, or cached RPC value is
never finality evidence.

## Deliberately absent

No arbitrary participant URL, backend fetch, TLS/domain assertion, price
oracle, governance document, external source, payment, escrow, payout, action
body, or downstream write is accepted in V1. An external-evidence extension
would require a separate authenticated evidence design before it could affect
the semantic question.

