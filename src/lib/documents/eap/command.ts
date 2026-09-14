import type { PlanSection } from '../plan-types'

// Part A. Who leads, how the alarm is raised, and who is called.
//
// Everything after this is one emergency on one page. This part is the one
// that has to be filled in and known by heart, because every page after it
// assumes somebody knows how to raise the alarm and who takes charge when
// they do.

const PART = 'A. Command, alarm and communications'

export const COMMAND_SECTIONS: PlanSection[] = [
  {
    part: PART,
    heading: 'Before anything else',
    intro:
      'Complete this page and put it where it can be read without unlocking anything. Nothing else in this plan '
      + 'works until these are filled in and every member of the team knows them without looking.',
    mustBeChecked: true,
    facts: [
      { label: 'Emergency telephone, and where it is' },
      { label: 'How the alarm is raised', long: true, hint: 'The word, the whistle signal, the button, and where each one is.' },
      { label: 'What each alarm signal sounds like and what it means', long: true },
      { label: 'Assembly point' },
      { label: 'Secondary assembly point, if the first is unusable' },
      { label: 'The address given to emergency services, word for word', long: true, hint: 'Including the entrance they should come to and any access code or barrier.' },
      { label: 'Which door or gate the ambulance uses, and who meets it' },
      { label: 'Where the defibrillator is' },
      { label: 'Where the spinal board and immobiliser are' },
      { label: 'Where the first aid kits are' },
      { label: 'Pool plant isolation point, and who holds the key' },
      { label: 'Main electrical isolation point' },
      { label: 'Water stopcock' },
      { label: 'Gas isolation point, where there is a gas supply' },
      { label: 'Ventilation controls, and where they are operated from' },
    ],
  },
  {
    part: PART,
    heading: 'Who to call',
    table: {
      columns: ['Who', 'Name', 'Number', 'When to call them'],
      rows: [
        ['Emergency services', '999', '', 'Any emergency where life or serious injury is possible'],
        ['Duty manager', '', '', ''],
        ['Spa manager', '', '', ''],
        ['General manager or property lead', '', '', ''],
        ['Hotel reception or switchboard', '', '', ''],
        ['On-site security', '', '', ''],
        ['Maintenance or engineering', '', '', ''],
        ['Pool plant contractor', '', '', ''],
        ['Water treatment specialist', '', '', ''],
        ['Electrical contractor', '', '', ''],
        ['Plumbing contractor', '', '', ''],
        ['Gas emergency service', '0800 111 999', '', 'Any smell of gas'],
        ['Utility supplier, water', '', '', ''],
        ['Utility supplier, electricity', '', '', ''],
        ['Environmental health', '', '', ''],
        ['Health and safety enforcing authority', '', '', ''],
        ['Insurer, incident notification line', '', '', ''],
        ['Safeguarding lead', '', '', ''],
        ['Occupational health', '', '', ''],
        ['Laundry contractor', '', '', ''],
        ['Waste and clinical waste contractor', '', '', ''],
        ['', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'Who leads, and what each role does',
    intro:
      'One person leads. Everybody else takes an instruction from them. Two people improvising in parallel is '
      + 'worse than either acting alone, and it is what happens when this table is blank.',
    table: {
      columns: ['Role in an emergency', 'Held by', 'Deputy', 'What they do first'],
      rows: [
        ['Incident lead', '', '', ''],
        ['Casualty care', '', '', ''],
        ['Calls the emergency services', '', '', ''],
        ['Meets the ambulance', '', '', ''],
        ['Clears and holds the water', '', '', ''],
        ['Sweeps the enclosed spaces', '', '', ''],
        ['Manages other guests', '', '', ''],
        ['Accounts for everybody at the assembly point', '', '', ''],
        ['Isolates plant or power', '', '', ''],
        ['Records times and actions', '', '', ''],
        ['Speaks to anybody outside the property', '', '', ''],
        ['', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
  {
    part: PART,
    heading: 'What every emergency has in common',
    paragraphs: [
      'Raise the alarm before doing anything else. One person acting alone and silently is the most common way a '
      + 'recoverable incident becomes a serious one.',
      'Clear the water when any emergency is declared, unless doing so would put somebody in more danger. Bathers '
      + 'still in the water are bathers somebody has to watch while dealing with the incident.',
      'One person leads. Everybody else takes an instruction from them.',
      'Do not move a casualty unless leaving them where they are puts them in further danger.',
      'Send for the defibrillator at the same moment you start resuscitation, not afterwards.',
      'Somebody meets the emergency services at the door and takes them to the casualty. Time spent finding a spa '
      + 'inside a hotel is time off the clock.',
      'Somebody writes down the times as they happen. Nobody remembers them accurately afterwards, and the times '
      + 'are the first thing asked for.',
      'Nothing is put back to normal until the person leading says so, and nothing is tidied away before it has '
      + 'been recorded.',
      'Nobody speaks to a journalist, posts anything, or discusses the incident outside the team. One named '
      + 'person handles anything from outside the property.',
    ],
  },
  {
    part: PART,
    heading: 'Raising the alarm, and what happens next',
    actions: [
      { name: 'Shout or signal', action: 'Use the agreed word or signal. Say what has happened and where, in that order: "casualty in the main pool", not "help".', by: '' },
      { name: 'Send, do not go', action: 'Send a named person for help, for the defibrillator, or to call. Point at somebody and name the task, because a general instruction is one nobody takes.', by: '' },
      { name: 'Declare it', action: 'The incident lead declares what kind of emergency it is, so everybody is working on the same one.', by: '' },
      { name: 'Clear the water', action: 'Get every bather out of every body of water unless doing so is more dangerous than leaving them.', by: '' },
      { name: 'Start the clock', action: 'Somebody notes the time the alarm was raised. Everything afterwards is measured from it.', by: '' },
    ],
  },
]
