# Translation Review Guide

## Overview

This document provides guidance for reviewing and improving translations in the Stadtwerke Plattling outage notification system. The application supports four languages: German (DE), English (EN), French (FR), and Spanish (ES).

## Translation Files

- **Client strings**: `client/src/i18n/strings.js` - All UI text
- **Manual content**: `client/src/i18n/manual.js` - In-app handbook
- **Message templates**: `server/core/compose.js` - Generated message templates
- **Catalog**: `server/data/catalog.js` - Service names, preset names, and causes

## Translation Standards

### 1. Tone and Style

- **German**: Formal but approachable, use "Sie" (formal you)
- **English**: Clear, concise, action-oriented
- **French**: Standard formal French (France)
- **Spanish**: Neutral Spanish (Spain/International)

### 2. Context-Specific Guidelines

#### Emergency Communications
- Keep messages short and clear (people read on phones while standing)
- Use imperative mood for instructions
- Avoid idioms that don't translate directly
- Prioritize clarity over elegance

#### Health-Related Messages
- Be direct and unambiguous
- Use strong, clear warnings
- Avoid softening language that could be misinterpreted

#### Technical Terms
- Keep utility names consistent: Strom/Electricity/Électricité/Electricidad
- Use industry-standard terminology where appropriate
- Maintain technical accuracy while being accessible

### 3. Character Limits

- Push notifications: Keep under 200 characters per language
- Message titles: Under 100 characters preferred
- Card headings: Under 80 characters preferred

## Common Translation Issues

### 1. False Friends

| German | English | French | Spanish | Notes |
|--------|---------|--------|---------|-------|
| aktuell | currently | actuellement | actualmente | Not "actual" in English |
| werden | become | devenir | convertirse | Not "will" in present tense |
| auch | also/also | aussi | también | Check context |

### 2. Cultural Differences

- **Emergency terminology**: "Störung" (DE) vs "Outage" (EN) vs "Panne" (FR) vs "Incidencia" (ES)
- **Time expressions**: "in X Minuten" vs "in X minutes" vs "dans X minutes" vs "en X minutos"
- **Civility levels**: German uses formal "Sie", Spanish uses "usted" for formal contexts

### 3. Technical Terms to Keep Consistent

| Concept | DE | EN | FR | ES |
|---------|----|----|----|----|
| Household | Haushalt | household | foyer | hogar |
| District | Ortsteil | district | quartier | zona |
| Supply | Versorgung | supply | approvisionnement | suministro |
| Network | Netz | network | réseau | red |
| Boil notice | Abkochgebot | boil-water notice | consigne d'ébullition | aviso de hervir el agua |

## Review Checklist

For each translation key, verify:

- [ ] **Accuracy**: Does it convey the same meaning as the German original?
- [ ] **Clarity**: Is it immediately understandable by a non-technical user?
- [ ] **Consistency**: Does it use the same terminology as similar messages?
- [ ] **Tone**: Is it appropriate for the context (emergency vs. information)?
- [ ] **Length**: Does it fit within the UI constraints?
- [ ] **Grammar**: Are verb forms, gender agreements, and plurals correct?
- [ ] **Cultural appropriateness**: Does it sound natural to native speakers?

## Areas Requiring Special Attention

### Health and Safety Messages

Critical messages (boil notices, health alerts) must be reviewed by native speakers:

1. **Trübung / Abkochgebot** (DE) - Water turbidity/boil notice
2. **Abkochgebot** templates in `server/core/compose.js`
3. Health-related advice in `client/src/i18n/manual.js`

### Emergency Keywords

Ensure these are translated consistently across all files:

- Störung / Outage / Panne / Incidencia
- Entwarnung / All-clear / Fin d'alerte / Fin de aviso
- Behoben / Fixed / Résolu / Resuelto
- Aktuell / Current / Actuel / Actual

### Date and Time Formats

- German: "14:30 Uhr", "15.10.2026"
- English: "2:30 PM", "10/15/2026"
- French: "14h30", "15/10/2026"
- Spanish: "14:30", "15/10/2026"

## Testing Translations

### Manual Testing Steps

1. Switch language in the header (🌐 icon)
2. Navigate through all screens: Home, Report, Approve, Send, Manual
3. Check that:
   - No placeholder text (⟨key⟩) is visible
   - Text fits within buttons and cards
   - No truncation occurs
   - Tone is appropriate for each screen

### Automated Checks

The application has a built-in safety feature: if a translation key is missing, it displays `⟨key⟩` as a visible marker instead of silently failing. This makes missing translations immediately obvious during testing.

## Future Improvements

### Priority Areas for Review

1. **Emergency messages** - highest priority, native speaker review recommended
2. **Help manual** - already well-translated, minor polish may help
3. **Technical terms** - ensure consistency across all files
4. **Character limits** - test on small screens (iPhone SE size)

### Adding New Languages

To add a new language:

1. Add language to `LANGUAGES` array in `client/src/i18n/index.jsx`
2. Add all translations to `client/src/i18n/strings.js`
3. Add manual content to `client/src/i18n/manual.js`
4. Add message templates to `server/core/compose.js`
5. Add catalog names to `server/data/catalog.js`
6. Test with the missing-key marker to ensure all keys are translated

## Contact

For translation questions or to report issues:
- Check the issue tracker
- Contact the development team
- Native speaker review is available for health/safety messages

## Last Updated

October 13, 2026
