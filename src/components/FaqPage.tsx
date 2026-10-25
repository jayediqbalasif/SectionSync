import { Plus } from 'lucide-react';

const FAQ = [
  ['Where do the official course details come from?', 'The active catalog is UIU BSCSE Fall 2026. Enter a course code with or without spaces to fill its title, credits and type. Choose a listed faculty or section to load its published schedule.'],
  ['Can I change an official schedule?', 'Yes. Choosing a day or slot that is not offered asks for confirmation. An override is marked Customized. Editing the faculty or priority preserves your saved times and rooms until you deliberately change the schedule.'],
  ['How is a new trimester added?', 'A new routine PDF is imported and checked by the site maintainer before its catalog is published. Browser JSON backups restore your workspace; they do not replace the official catalog.'],
  ['What if my saved data cannot be read?', 'Saving is blocked to protect the original data. Download the original data from the warning first, then restore a valid backup or explicitly choose Use current workspace.'],
  [
    'Do I need an account?',
    'No. Open the planner and start choosing sections. SectionSync does not need a sign-in or a backend.',
  ],
  [
    'Where is my routine saved?',
    'Your courses, selections, and saved plans stay in this browser on this device. Use Storage & backups to download a JSON backup. Clearing browser data can remove your workspace.',
  ],
  [
    'How do fixed time slots work?',
    'Set a course to Theory or Lab. In the section editor, choose the class days and one time slot. The preview shows the meetings that will be saved.',
  ],
  [
    'How do I avoid overlapping classes?',
    'Turn on Hide conflicts in Planner to hide sections that overlap your current choices. You can turn it off to compare alternatives.',
  ],
  [
    'Can I print or move my routine to another device?',
    'Open Routine to print or save a PDF. To move your editable workspace, export a JSON backup and import it in the other browser.',
  ],
  [
    'Is this an official registration system?',
    'No. SectionSync is a planning tool. Confirm course details with your university and complete registration through its official system. The starter courses are examples.',
  ],
];

export function FaqPage() {
  return (
    <section className="home-faq faq-page" id="faq" aria-labelledby="faq-title">
      <div className="faq-heading">
        <p className="eyebrow">§ 01 — GOOD TO KNOW</p>
        <h1 id="faq-title">
          Questions,
          <br />
          answered.
        </h1>
      </div>
      <div className="faq-list">
        {FAQ.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <Plus size={16} aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
