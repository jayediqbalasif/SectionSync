import { Plus } from 'lucide-react';

const FAQ = [
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
