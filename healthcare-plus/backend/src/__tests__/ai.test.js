import { triageSymptoms } from '../services/ai.service.js';

describe('AI Triage', () => {
  it('identifies heart related symptoms as Critical Cardiology', async () => {
    const result = await triageSymptoms('I have severe chest pain and shortness of breath');
    expect(result.recommendedSpecialty).toBe('Cardiology');
    expect(result.urgency).toBe('Critical');
  });

  it('identifies bone related symptoms as High Orthopedics', async () => {
    const result = await triageSymptoms('I think I broke my bone');
    expect(result.recommendedSpecialty).toBe('Orthopedics');
    expect(result.urgency).toBe('Medium');
  });

  it('defaults to Low General Medicine', async () => {
    const result = await triageSymptoms('I have a mild fever');
    expect(result.recommendedSpecialty).toBe('General Medicine');
    expect(result.urgency).toBe('Low');
  });
});
