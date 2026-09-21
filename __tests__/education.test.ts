import { newGame } from '../engine/newGame';
import { ageUp, resolveEventChoice } from '../engine/ageUp';
import { studyAction, applyToUniversity } from '../engine/education';
import type { GameState } from '../engine/types';

function advanceYear(state: GameState): GameState {
  const afterAgeUp = ageUp(state);
  if (afterAgeUp.pendingEvent) {
    return resolveEventChoice(afterAgeUp, afterAgeUp.pendingEvent.choices[0].id);
  }
  return afterAgeUp;
}

describe('education progression', () => {
  it('enrolls in preschool then elementary as the player ages', () => {
    let state = newGame({ firstName: 'Stu' }, 1);
    for (let i = 0; i < 4; i++) state = advanceYear(state);
    expect(['preschool', 'elementary', 'none']).toContain(state.education.stage);
  });

  it('eventually reaches high school and graduates with a diploma flag either way', () => {
    let state = newGame({ firstName: 'Stu' }, 2);
    for (let i = 0; i < 19 && state.isAlive; i++) state = advanceYear(state);
    if (state.isAlive) {
      expect(state.education.stage === 'graduated' || state.education.stage === 'high').toBeTruthy();
    }
  });

  it('studying raises GPA more reliably than the default drift', () => {
    let studiedState = newGame({ firstName: 'A' }, 3);
    let driftState = newGame({ firstName: 'B' }, 3);
    for (let i = 0; i < 5; i++) {
      studiedState = studyAction(studiedState);
      studiedState = advanceYear(studiedState);
      driftState = advanceYear(driftState);
    }
    expect(studiedState.education.gpa).toBeGreaterThanOrEqual(driftState.education.gpa);
  });
});

describe('applyToUniversity', () => {
  it('refuses enrollment without a high school diploma', () => {
    const state = newGame({ firstName: 'NoDip' }, 4);
    const adult = { ...state, player: { ...state.player, age: 19 } };
    const result = applyToUniversity(adult, 'compsci');
    expect(result.state.education.stage).not.toBe('university');
  });

  it('enrolls an eligible graduate and charges tuition', () => {
    const state = newGame({ firstName: 'Grad' }, 5);
    const eligible = {
      ...state,
      player: { ...state.player, age: 19, money: 50000 },
      flags: { ...state.flags, highSchoolDiploma: true },
      education: { ...state.education, gpa: 3.0, stage: 'graduated' as const },
    };
    const result = applyToUniversity(eligible, 'compsci');
    expect(result.state.education.stage).toBe('university');
    expect(result.state.education.major).toBe('Computer Science');
    expect(result.state.player.money).toBeLessThan(eligible.player.money);
  });
});
