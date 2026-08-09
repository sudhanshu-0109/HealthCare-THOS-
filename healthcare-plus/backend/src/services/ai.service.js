/**
 * services/ai.service.js — Intelligent symptom mapping and triage.
 */

export const triageSymptoms = async (symptoms) => {
  const keywords = symptoms.toLowerCase();
  
  // Default fallback
  let recommendedSpecialty = 'General Medicine';
  let urgency = 'Low';
  let reason = 'Your symptoms are general. A General Physician can provide an initial assessment and guide you further if necessary.';

  // 1. Cardiology (Heart/Chest)
  if (keywords.match(/\b(heart|chest|breath|breathing|palpitation|chest pain)\b/i)) {
    recommendedSpecialty = 'Cardiology';
    urgency = 'Critical';
    reason = 'Chest discomfort and breathing difficulties can have several urgent causes. These symptoms should be assessed immediately by a cardiologist or emergency services rather than self-diagnosed.';
  } 
  // 2. Orthopedics (Bones/Joints)
  else if (keywords.match(/\b(bone|fracture|break|joint|knee|back pain|spine|muscle|sprain)\b/i)) {
    recommendedSpecialty = 'Orthopedics';
    urgency = 'Medium';
    reason = 'Your symptoms involve the musculoskeletal system (bones, joints, or muscles), making an orthopedic specialist the most appropriate choice for diagnosis and treatment.';
  } 
  // 3. Neurology (Brain/Nerves)
  else if (keywords.match(/\b(headache|dizzy|dizziness|numb|tingling|memory|seizure|migraine|brain)\b/i)) {
    recommendedSpecialty = 'Neurology';
    urgency = 'High';
    reason = 'Symptoms like severe headaches, dizziness, or nerve-related issues (numbness) are best evaluated by a neurologist to rule out any central nervous system conditions.';
  } 
  // 4. Dermatology (Skin/Hair)
  else if (keywords.match(/\b(skin|rash|acne|itching|itch|hair fall|scalp|nail|pimple|eczema)\b/i)) {
    recommendedSpecialty = 'Dermatology';
    urgency = 'Low';
    reason = 'Your symptoms primarily involve the skin, hair, or nails. A dermatologist is the right specialist to consult for these conditions.';
  } 
  // 5. Pediatrics (Children)
  else if (keywords.match(/\b(child|baby|infant|kid|toddler)\b/i)) {
    recommendedSpecialty = 'Pediatrics';
    urgency = 'Medium';
    reason = 'Since the symptoms are related to a child or infant, a pediatrician is specially trained to provide the best medical care and evaluation.';
  } 
  // 6. ENT (Ear, Nose, Throat)
  else if (keywords.match(/\b(ear|throat|nose|sinus|hearing|tonsil|swallow)\b/i)) {
    recommendedSpecialty = 'ENT';
    urgency = 'Low';
    reason = 'Symptoms involving the ears, nose, sinuses, or throat are the primary focus of an ENT (Ear, Nose, and Throat) specialist.';
  } 
  // 7. Gynecology (Women's Health)
  else if (keywords.match(/\b(period|pregnancy|pregnant|vaginal|uterus|cramp|menstruation|women)\b/i)) {
    recommendedSpecialty = 'Gynecology';
    urgency = 'Medium';
    reason = 'These symptoms relate to the female reproductive system or women\'s health, which is best addressed by a gynecologist.';
  } 
  // 8. Ophthalmology (Eyes)
  else if (keywords.match(/\b(eye|vision|blind|cataract|sight|blur)\b/i)) {
    recommendedSpecialty = 'Ophthalmology';
    urgency = 'Medium';
    reason = 'Any issues related to your eyes or vision require specialized equipment and expertise provided by an ophthalmologist.';
  } 
  // 9. Dentistry (Teeth/Mouth)
  else if (keywords.match(/\b(tooth|teeth|gum|dental|mouth|jaw)\b/i)) {
    recommendedSpecialty = 'Dentistry';
    urgency = 'Low';
    reason = 'Dental and oral health problems, including tooth pain or gum issues, should be evaluated by a dentist.';
  } 
  // 10. Psychiatry (Mental Health)
  else if (keywords.match(/\b(depress|anxi|stress|panic|sleep|insomnia|mental|suicid)\b/i)) {
    recommendedSpecialty = 'Psychiatry';
    urgency = keywords.includes('suicid') ? 'Critical' : 'Medium';
    reason = 'Mental health symptoms such as severe stress, anxiety, or depression are best supported and treated by a psychiatrist or mental health professional.';
  } 
  // 11. Gastroenterology (Digestive)
  else if (keywords.match(/\b(stomach|vomit|nausea|digestion|diarrhea|constipation|acid|gut|belly)\b/i)) {
    recommendedSpecialty = 'Gastroenterology';
    urgency = 'Medium';
    reason = 'Symptoms related to the digestive tract (stomach, intestines) are effectively diagnosed and managed by a gastroenterologist.';
  }
  // 12. General fever/cold fallback
  else if (keywords.match(/\b(fever|cold|cough|tired|weak)\b/i)) {
    recommendedSpecialty = 'General Medicine';
    urgency = 'Low';
    reason = 'Mild common symptoms like a fever, cold, or general weakness can be effectively treated by a General Physician.';
  }

  return {
    recommendedSpecialty,
    urgency,
    reason,
    disclaimer: "This is general AI-driven guidance, not a medical diagnosis. Please consult a qualified medical professional.",
  };
};
