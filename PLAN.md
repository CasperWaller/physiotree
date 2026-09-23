# PhysioTree — Project Plan

## 1. Goal

Build an interactive, editable mind map that models the physiotherapeutic assessment process, starting with the shoulder:

**Region → Symptom → Test → Finding (positive/negative) → Diagnosis**

Target user: physiotherapy students who want to practise clinical reasoning and quickly look up how a test is performed and how reliable it is.

---

## 2. Core principles

1. **Content is separate from code.** All clinical content lives in `content/` as YAML and Markdown. The app just reads and draws it.
2. **Each test and diagnosis exists once.** The tree references them by `id`, so updating a test's sensitivity updates it everywhere.
3. **Every number has a source.** No sensitivity/specificity value without a reference.
4. **Easy to extend.** Adding a new body region = adding one new YAML file.
5. **All labels in the app are in Swedish.** Symptoms, findings, diagnoses, UI text and test descriptions are written in Swedish (e.g. "Smärta vid flexion/abduktion", "Positivt fynd", "Negativt fynd"). Established test names keep their international name where that is standard in Swedish physiotherapy education (e.g. "Empty can-test", "Hawkins-Kennedy"). File names and `id`s use lowercase ASCII without å/ä/ö (e.g. `smarta-flexion-abduktion`) to avoid problems with URLs and file systems.

---

## 3. Data model

### Node types

| Type | Stored in | Key fields |
|---|---|---|
| Region | `content/regions/<region>.yaml` | `region`, `symptoms[]` |
| Symptom | inside region file | `id`, `label`, `tests[]` |
| Test | `content/tests/<id>.md` | `id`, `name`, `structure`, `sensitivity`, `specificity`, `lr_positive`, `lr_negative`, `source`, `video` |
| Finding | inside region file (per test) | `positive` / `negative` → `finding`, `diagnoses[]`, `next_tests[]` |
| Diagnosis | `content/diagnoses/<id>.md` | `id`, `name`, `umbrella` (optional parent), `description`, `related_tests[]` |

### Umbrella diagnoses

Some diagnoses are umbrella terms (e.g. *subacromial pain syndrome*, formerly "impingement"). A diagnosis can have an `umbrella:` field pointing to its parent, so the app can show the hierarchy.

---

## 4. Shoulder — first content draft

To be reviewed and adjusted by you before we treat it as final.

### Symptoms → tests → possible diagnoses

**Pain on flexion / abduction**
- Empty can (Jobe) → rotator cuff tendinopathy, partial/full supraspinatus tear, subacromial pain syndrome
- Full can → as above (often less painful to perform)
- Painful arc (60–120°) → subacromial pain syndrome
- Hawkins-Kennedy → subacromial pain syndrome
- Neer → subacromial pain syndrome

**Weakness on elevation / inability to hold the arm up**
- Drop arm test → full-thickness rotator cuff tear
- External rotation lag sign → infraspinatus/supraspinatus tear

**Pain / weakness in external rotation**
- Resisted external rotation (infraspinatus test) → infraspinatus tendinopathy/tear
- Hornblower's sign → teres minor involvement

**Pain / weakness in internal rotation**
- Lift-off test → subscapularis tear
- Belly press test → subscapularis tear
- Bear hug test → subscapularis tear

**Anterior shoulder pain**
- Speed's test → biceps tendinopathy, SLAP lesion
- Yergason's test → biceps tendinopathy
- O'Brien's (active compression) → SLAP lesion, AC joint pathology

**Pain on top of the shoulder**
- Cross-body adduction → AC joint pathology
- AC resisted extension test → AC joint pathology

**Feeling of instability / "shoulder slips out"**
- Apprehension test → anterior instability
- Relocation test → anterior instability
- Sulcus sign → inferior / multidirectional instability
- Load and shift → anterior/posterior instability

**Loss of both active and passive range (esp. external rotation)**
- Passive ROM assessment (capsular pattern) → frozen shoulder (adhesive capsulitis)

### Always-included screening branch
- Cervical spine screen (referred pain from the neck)
- Red flags (e.g. trauma, unexplained weight loss, night pain + systemic symptoms) → refer

### Future idea: test clusters
Some tests are more useful in combination than alone (e.g. clusters for rotator cuff tears or subacromial pain). Later we can add a `clusters/` folder that combines several tests and shows the combined probability.

---

## 5. Roadmap

### Phase 1 — Setup (day 1)
- [ ] Create GitHub repo `physiotree`
- [ ] Clone into VS Code
- [ ] Scaffold Vite + React + TypeScript project
- [ ] Add React Flow and dagre
- [ ] Add README and PLAN

### Phase 2 — Content (shoulder)
- [ ] Create `templates/test-template.md` and `templates/diagnosis-template.md`
- [ ] Write `content/regions/shoulder.yaml` from the draft in section 4
- [ ] Create one file per shoulder test (~20 files)
- [ ] Create diagnosis files
- [ ] Add Physiotutors video links for each test
- [ ] Fill in sensitivity/specificity **with sources** (verify each value)

### Phase 3 — The mind map
- [ ] Load YAML/Markdown at build time
- [ ] Render the tree with React Flow, auto-layout with dagre
- [ ] Colour-code node types (symptom / test / positive / negative / diagnosis)
- [ ] Expand/collapse branches
- [ ] Click a test → side panel with how-to, accuracy data and video link

### Phase 4 — Usability
- [ ] Search bar (find tests, symptoms, diagnoses)
- [ ] "Guided mode": step through the tree one question at a time, like an assessment
- [ ] Mobile-friendly layout
- [ ] Deploy to GitHub Pages

### Phase 5 — More regions
- [ ] Knee
- [ ] Hip
- [ ] Lumbar spine
- [ ] Cervical spine
- [ ] Ankle / foot
- [ ] Elbow / wrist / hand

### Maybe later
- Visual editor in the app (drag nodes, edit text, save back to files)
- Swedish/English language toggle
- Quiz mode generated from the tree
- Likelihood ratio calculator (pre-test → post-test probability)

---

## 6. Content quality checklist (per test)

- [ ] Correct name (and common alternative names)
- [ ] Which structure it tests
- [ ] How to perform (short, in your own words)
- [ ] What counts as a positive finding
- [ ] Sensitivity / specificity / LR+ / LR− with source
- [ ] Study population noted if relevant
- [ ] Video link works
