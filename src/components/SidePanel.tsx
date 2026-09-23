import ReactMarkdown from 'react-markdown';
import type { Diagnosis, Test } from '../lib/types';

interface Props {
  test?: Test;
  diagnosis?: Diagnosis;
  onClose: () => void;
  onSelectTest?: (id: string) => void;
}

function formatPercent(value: number | null): string {
  return value == null ? 'ej angivet' : `${Math.round(value * 100)} %`;
}

function formatLr(value: number | null): string {
  return value == null ? 'ej angivet' : value.toFixed(1);
}

function TestView({ test }: { test: Test }) {
  const hasData =
    test.sensitivity != null ||
    test.specificity != null ||
    test.lr_positive != null ||
    test.lr_negative != null;

  return (
    <>
      <p className="side-panel__structure">
        Belastar: <strong>{test.structure || 'ej angivet'}</strong>
      </p>

      <h3>Diagnostisk träffsäkerhet</h3>
      {hasData ? (
        <table className="accuracy">
          <tbody>
            <tr>
              <td>Sensitivitet</td>
              <td>{formatPercent(test.sensitivity)}</td>
            </tr>
            <tr>
              <td>Specificitet</td>
              <td>{formatPercent(test.specificity)}</td>
            </tr>
            <tr>
              <td>LR+</td>
              <td>{formatLr(test.lr_positive)}</td>
            </tr>
            <tr>
              <td>LR−</td>
              <td>{formatLr(test.lr_negative)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="side-panel__muted">Ännu ingen källbelagd data.</p>
      )}
      {test.source && <p className="side-panel__source">Källa: {test.source}</p>}

      {test.video && (
        <p>
          <a href={test.video} target="_blank" rel="noreferrer" className="side-panel__video">
            ▶ Visa demonstrationsvideo
          </a>
        </p>
      )}

      <div className="side-panel__body">
        <ReactMarkdown>{test.body}</ReactMarkdown>
      </div>
    </>
  );
}

function DiagnosisView({
  diagnosis,
  onSelectTest,
}: {
  diagnosis: Diagnosis;
  onSelectTest?: (id: string) => void;
}) {
  return (
    <>
      {diagnosis.umbrella && (
        <p className="side-panel__structure">
          Paraplydiagnos: <strong>{diagnosis.umbrella}</strong>
        </p>
      )}
      <div className="side-panel__body">
        <ReactMarkdown>{diagnosis.body}</ReactMarkdown>
      </div>
      {diagnosis.related_tests?.length > 0 && (
        <>
          <h3>Relaterade tester</h3>
          <ul className="side-panel__links">
            {diagnosis.related_tests.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => onSelectTest?.(t)}>
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export function SidePanel({ test, diagnosis, onClose, onSelectTest }: Props) {
  if (!test && !diagnosis) return null;
  return (
    <aside className="side-panel">
      <button type="button" className="side-panel__close" onClick={onClose} aria-label="Stäng">
        ×
      </button>
      <span className="side-panel__tag">{test ? 'Test' : 'Diagnos'}</span>
      <h2>{test ? test.name : diagnosis!.name}</h2>
      {test ? (
        <TestView test={test} />
      ) : (
        <DiagnosisView diagnosis={diagnosis!} onSelectTest={onSelectTest} />
      )}
    </aside>
  );
}
