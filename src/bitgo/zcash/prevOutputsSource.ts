/**
 * Internal link between a ZcashTransactionBuilder and the transaction it builds: the builder registers a function
 * that returns the prevout data (scriptPubKey and value) of every input, read when a ZIP 244 signature hash is
 * computed. The builder fills the scriptPubKey of the input being signed only during `sign()`, so the data must be
 * read lazily. Not exported from the package index.
 */
import type { ZcashPrevOutput } from './hashZip0244';

type Source = () => ZcashPrevOutput<any>[];

const sources = new WeakMap<object, Source>();

export function setPrevOutputsSource(tx: object, source: Source | undefined): void {
  if (source) {
    sources.set(tx, source);
  } else {
    sources.delete(tx);
  }
}

export function getPrevOutputsSource(tx: object): Source | undefined {
  return sources.get(tx);
}
