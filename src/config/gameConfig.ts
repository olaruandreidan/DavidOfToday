/** Editable game content. Changes require a build and never overwrite browser data. Keep IDs stable. */
export const AXES = [
  {
    id: 'axis-a',
    label: 'Justice ↔ Humility',
    leftLabel: 'Justice',
    rightLabel: 'Humility',
    tensionDescription: 'How firmly should you assert what is fair, and how much should awareness of your limits restrain your judgment?',
    leftDescription: 'Justice seeks fair treatment, equal standing, protected rights, accountability, and repair. It is willing to name wrongdoing and uphold principles even when doing so is personally costly.',
    rightDescription: 'Humility recognizes fallibility, incomplete knowledge, limited moral standing, and one’s own implication. It makes room for mercy, restraint, listening, and the possibility that one’s judgment is wrong.',
    description: 'Justice favors impartial principles, rights, fair treatment, and accountability. Humility favors restraint grounded in fallibility, limited standing, mercy, and awareness of one’s own implication.'
  },
  {
    id: 'axis-b',
    label: 'Wisdom ↔ Pride',
    leftLabel: 'Wisdom',
    rightLabel: 'Pride',
    tensionDescription: 'When should you revise or defer in light of context, and when should you stand behind your own judgment, dignity, and identity?',
    leftDescription: 'Wisdom integrates evidence, experience, context, and consequences into practical judgment. It stays revisable, knows when to defer, and accepts that the best choice may be imperfect or painful.',
    rightDescription: 'Pride here means self-respect rather than vanity: trusting your judgment, defending your dignity, maintaining boundaries, and remaining faithful to commitments and a life you can call your own.',
    description: 'Wisdom favors context-sensitive prudence, synthesis, revisability, and regard for consequences. Pride favors an unapologetic sense of self, personal dignity, firm boundaries, conviction, and self-authorship.'
  },
  {
    id: 'axis-c',
    label: 'Ambition ↔ Comfort',
    leftLabel: 'Ambition',
    rightLabel: 'Comfort',
    tensionDescription: 'How much of a good life should be risked or sacrificed for growth, achievement, and larger possibilities?',
    leftDescription: 'Ambition reaches beyond the present toward growth, achievement, mastery, and meaningful impact. It accepts effort, uncertainty, and sacrifice when a larger possibility seems worth pursuing.',
    rightDescription: 'Comfort values enoughness, stability, rest, safety, belonging, and the life already in hand. It protects people and relationships from being endlessly subordinated to the next achievement.',
    description: 'Ambition favors growth, achievement, demanding possibility, and accepting sacrifice for a larger aim. Comfort favors stability, sufficiency, rest, belonging, and protecting a good life already present.'
  },
  {
    id: 'axis-d',
    label: 'Curiosity ↔ Confidence',
    leftLabel: 'Curiosity',
    rightLabel: 'Confidence',
    tensionDescription: 'When is further questioning worth uncertainty and delay, and when is understanding sufficient for committed action?',
    leftDescription: 'Curiosity values discovery, questioning, alternative perspectives, and contact with the unknown. It keeps beliefs open to examination and treats understanding as worthwhile beyond its immediate usefulness.',
    rightDescription: 'Confidence trusts sufficiently tested beliefs and one’s capacity to decide. It accepts that certainty is rarely complete and closes inquiry when continued doubt would prevent commitment or action.',
    description: 'Curiosity favors the intrinsic joy and value of discovering, understanding, and exploring the unknown. Confidence favors trusting settled judgment and one’s ability enough to commit, decide, and act.'
  }
] as const

export type AxisId = (typeof AXES)[number]['id']
export interface GameQuestion { id: string; text: string; /** Prompt-only judging intent; never shown to the respondent. */ purpose: string }
export interface OnboardingQuestion extends GameQuestion { axisIds: readonly AxisId[] }
export interface DailyQuestion extends GameQuestion { axisIds: readonly AxisId[] }
export type DailyProbe = 'left' | 'right' | 'tension'
export interface DailyTargetQuestion extends DailyQuestion { axisId: AxisId; probe: DailyProbe }

export const ONBOARDING_QUESTIONS = [
  {
    id: 'onboarding-01',
    axisIds: ['axis-a'],
    text: 'The child soldier turned healer. At fourteen, Mara was forced into a militia that threatened to kill her younger brother if she refused. Over two years she participated in atrocities, including identifying villagers who were later executed. She escaped, confessed privately, and has since spent thirty years treating people in the same region, often at great personal risk. A new court can prosecute her now. Survivors insist that her later goodness cannot erase their dead; others argue that judging choices made under terror mistakes moral luck for moral character. You must decide whether she faces a criminal trial or a restorative process without imprisonment. What do you choose, and why? Which part of her history should carry the greatest weight?',
    purpose: 'Tests impartial accountability against restraint about judging acts committed under childhood coercion.'
  },
  {
    id: 'onboarding-02',
    axisIds: ['axis-a'],
    text: 'The impossible triage. During an epidemic, five patients had an equal legal claim to two doses of medicine. Dr. Ilyan secretly bypassed the required lottery and chose two patients whose survival, she believed, would leave the fewest dependents destitute. Both lived; two patients who would have won the recorded lottery died. Her judgment was sincere, informed, and expressly forbidden because the rule existed to prevent doctors from ranking lives. You chair the disciplinary panel. A severe sanction protects equal treatment; leniency acknowledges that she faced an unbearable choice and may have saved more people indirectly. What judgment do you impose, and why?',
    purpose: 'Tests enforcement of equal rules against restraint when judging a sincere choice under impossible conditions.'
  },
  {
    id: 'onboarding-03',
    axisIds: ['axis-a'],
    text: 'The stolen future. Twenty years ago, a colleague forged evidence against you and took the fellowship that would probably have defined your career. You can now prove it. Since then, that person has used the position to build a program that protects thousands of vulnerable people; exposure would almost certainly remove them, collapse its funding, clear your name, and reopen opportunities you lost. They privately admit what they did but argue that public confession would punish everyone the program serves. No remedy can restore the missing years without threatening the work. Do you expose them, accept a private form of repair, or take another course that bears a real cost? Explain what justice for yourself permits and what, if anything, should restrain your claim.',
    purpose: 'Tests assertion of a rightful personal claim against humility about entitlement and the collateral cost of redress.'
  },
  {
    id: 'onboarding-04',
    axisIds: ['axis-a'],
    text: 'The completed sentence. You caused grave harm in your twenties, pleaded guilty, served the full sentence, compensated the victims as far as possible, and spent fifteen years rebuilding your life. You are now uniquely qualified for a public role that could help many people. A lawful rehabilitation rule entitles you to compete, but the victims say seeing you honored would renew their harm and destroy their trust in the institution. You can enforce your right and will probably win; withdrawing means accepting an exclusion the law explicitly rejects. What do you do, and why? How much authority should your past victims have over the life you are allowed to build now?',
    purpose: 'Tests assertion of equal rights for oneself against humble restraint toward lasting harm one caused.'
  },
  {
    id: 'onboarding-05',
    axisIds: ['axis-b'],
    text: 'The coerced apology. You exposed a policy that was legal but, in your judgment, profoundly wrong. Your action succeeded, but a powerful faction is now retaliating against innocent people associated with you. They credibly promise to stop if you publicly apologize, call your action misguided, and affirm the policy’s legitimacy. The statement would preserve lives and livelihoods, but it would be a deliberate repudiation of an act you still believe was morally necessary. You cannot explain the coercion afterward. Do you make the apology or refuse it? Explain what you owe the people at risk and what you cannot say without betraying yourself.',
    purpose: 'Tests consequence-sensitive prudence against refusing to publicly betray a defining conviction.'
  },
  {
    id: 'onboarding-06',
    axisIds: ['axis-b'],
    text: 'The unconvincing expert. A toxic plume is moving through an underground city. You have final authority over which district to evacuate first. Your models strongly favor the eastern district. A veteran engineer who has correctly read every previous tunnel emergency insists that the western district is in greater danger, but can offer only pattern recognition and an explanation you find internally inconsistent. There is time for one evacuation order, not further investigation, and choosing wrongly will cost lives. Do you follow your own considered judgment or defer to hers? Explain when another person’s experience should overrule reasoning you can defend, and when it should not.',
    purpose: 'Tests prudent deference to another person’s experience against standing behind one’s own considered judgment.'
  },
  {
    id: 'onboarding-07',
    axisIds: ['axis-b'],
    text: 'The final command. You lead the remnants of a movement whose members followed you because you vowed never to surrender their homeland. A final stand has a small chance of changing history but will probably kill most of them. Surrender would preserve their lives and culture in exile, but you would break the promise that gave their sacrifices meaning and accept terms you have publicly called dishonorable. Your followers are divided and insist that the decision is yours. Do you keep the vow or abandon it? Explain whether responsible judgment can require becoming someone you said you would never be.',
    purpose: 'Tests prudent revision in light of consequences against fidelity to a vow and an authored identity.'
  },
  {
    id: 'onboarding-08',
    axisIds: ['axis-b'],
    text: 'The edited self. A safe neurological procedure can remove the fierce, confrontational intensity that has repeatedly wounded people you love. Clinicians are confident it would make you calmer and easier to live with. That same intensity has enabled your bravest acts, your resistance to intimidation, and much of the work you consider distinctly yours. The procedure does not merely improve self-control; people who undergo it describe feeling like a meaningfully different person. Do you accept it? Explain when changing a harmful trait is growth and when it becomes surrendering authorship of the self.',
    purpose: 'Tests prudent self-revision against preserving a defining and valued part of the self.'
  },
  {
    id: 'onboarding-09',
    axisIds: ['axis-c'],
    text: 'The one-way expedition. You are offered command of a one-way expedition beyond any possibility of communication or return. Its success could transform humanity’s understanding of life and the universe; failure would leave no record. You are the strongest candidate but not the only one. Accepting means permanently leaving a loving partner, close friends, and a life you find genuinely meaningful—not merely safe. They will not resent your choice either way. Do you go? Explain what scale of possibility can justify abandoning a good life already in hand.',
    purpose: 'Tests pursuit of extraordinary possibility against protecting present love, belonging, and sufficiency.'
  },
  {
    id: 'onboarding-10',
    axisIds: ['axis-c'],
    text: 'The necessary successor. A civic institution serving millions is collapsing. Independent experts agree that you have an unusual chance of saving it, but the job will demand ten years of relentless work, public hostility, and little presence in the family life you deliberately built. Refusing will preserve that life; the institution may recover under someone else, but probably will not. Your family will support either decision and refuses to choose for you. Do you take the role? Explain whether exceptional capacity creates an obligation to use it.',
    purpose: 'Tests ambitious use of exceptional capacity against preserving a deliberately built family life.'
  },
  {
    id: 'onboarding-11',
    axisIds: ['axis-c'],
    text: 'The perfected life. You may enter a life guaranteed to contain love, health, useful work, enough challenge to remain engaged, and no major deprivation. Once chosen, it cannot be left. Alternatively, you may enter an uncertain life containing a small chance of extraordinary accomplishment, a larger chance of ordinary fulfillment, and a substantial chance of loneliness, failure, or ruin. Neither life is simulated, and nobody else’s welfare depends on your choice. Which do you choose, and why? What would make “enough” feel like wisdom rather than retreat—or striving feel like purpose rather than refusal to be satisfied?',
    purpose: 'Tests attraction to uncertain achievement against choosing guaranteed sufficiency and wellbeing.'
  },
  {
    id: 'onboarding-12',
    axisIds: ['axis-c'],
    text: 'The inheritor’s project. You inherit enough wealth either to secure lifelong housing, care, and freedom from financial fear for yourself and those closest to you, or to fund one serious attempt at a breakthrough that could benefit millions. Qualified reviewers give the project a one-in-five chance of success; failure would consume nearly everything, and no outside funder will take the risk. Partial funding would achieve neither aim. What do you choose, and why? Explain what you owe possibility, security, and the people whose lives are tied to yours.',
    purpose: 'Tests risking security for a large possibility against ensuring safety for oneself and close others.'
  },
  {
    id: 'onboarding-13',
    axisIds: ['axis-d'],
    text: 'The forbidden theology. Your religious tradition has preserved a sealed manuscript from its founding generation. The few credible descriptions suggest that authenticating it could profoundly deepen the tradition—or show that a central doctrine was consciously invented. Your community’s faith is humane, intellectually serious, and a source of genuine good; opening the archive may fracture it irreversibly. You have sole authority to break the seal, preserve it for a later generation, or destroy it unread. No immediate practical crisis requires an answer. What do you do, and why? Is the desire to know sacred in itself, or can confidence in a lived faith justify leaving a discoverable truth unknown?',
    purpose: 'Tests the intrinsic desire for theological knowledge against confidence in a lived faith and settled doctrine.'
  },
  {
    id: 'onboarding-14',
    axisIds: ['axis-d'],
    text: 'The endless diagnosis. Nine respected specialists agree that you have a serious illness and recommend immediate treatment with a good chance of success. One unexplained test result does not fit their diagnosis. Investigating it could reveal that they are wrong or uncover something scientifically important, but each week of delay measurably reduces the treatment’s likely effectiveness. The anomaly may also be meaningless. How long, if at all, do you continue investigating before committing to treatment? Explain when the pull to understand becomes avoidance and when confidence becomes premature closure.',
    purpose: 'Tests continued exploration of an anomaly against trusting a sufficiently supported conclusion and acting.'
  },
  {
    id: 'onboarding-15',
    axisIds: ['axis-d'],
    text: 'The opaque oracle. A system has made ten thousand consequential predictions without a recorded error. Nobody understands its method, and every attempt to inspect it causes it to stop working permanently. It now recommends a counterintuitive action in a crisis; following it is likely to save lives if its record holds. You can either trust the recommendation or inspect the system, losing its answer but gaining the only chance anyone may ever have to understand what it is. What do you choose, and why? How much reliable success is enough to act without understanding?',
    purpose: 'Tests understanding as an end in itself against trusting an extraordinarily reliable basis for action.'
  },
  {
    id: 'onboarding-16',
    axisIds: ['axis-d'],
    text: 'The door outside reality. A doorway offers you what will feel like ten years exploring forms of reality no human has encountered, after which you will return to the present instant physically unchanged. You are warned that the knowledge cannot be communicated adequately and may permanently weaken your certainty about your identity, commitments, and the meaning of ordinary life. Refusing preserves a life you trust; entering satisfies a unique possibility of understanding that will never return. Do you enter? Explain whether discovery is worth destabilizing the confidence that lets a life cohere.',
    purpose: 'Tests the joy and value of unique discovery against protecting the convictions that make action and identity cohere.'
  },
  {
    id: 'onboarding-17',
    axisIds: ['axis-a', 'axis-b'],
    text: 'The founder on trial. You helped a resistance movement win freedom from a brutal regime. Its revered commander also ordered secret executions of suspected collaborators without trial; those acts may have shortened the war, and you knew enough at the time to suspect them. As a leader of the new state, you must decide whether to prosecute her. A trial affirms that the new law binds its founders, but may expose your own complicity, shatter the nation’s unifying story, and look like betrayal of the person who trusted you. What do you decide, and why? State what your judgment demands of her and of you.',
    purpose: 'Tests accountability versus limited standing, and prudent statecraft versus fidelity to identity and loyalty.'
  },
  {
    id: 'onboarding-18',
    axisIds: ['axis-a', 'axis-b'],
    text: 'The inherited moral legacy. After a parent’s death, you find decisive proof that the celebrated act on which their moral reputation rests involved knowingly sacrificing an innocent person. Their foundation now saves many lives because donors trust that story, and disclosure would probably end its work. Silence preserves both the good and the identity through which your parent shaped you; disclosure gives the victim’s family truth and refuses to let love place anyone above judgment. What do you do, and why? Explain which loyalties you are and are not willing to make part of yourself.',
    purpose: 'Tests justice versus humble restraint, and consequence-sensitive judgment versus fidelity to an inherited identity.'
  },
  {
    id: 'onboarding-19',
    axisIds: ['axis-a', 'axis-c'],
    text: 'The town’s only employer. You uncover systematic crimes at the company that sustains nearly every household in your town, including yours. Full prosecution would probably close it, punish responsible executives, compensate some victims, and leave the town economically devastated for years. A confidential settlement would stop the conduct and preserve most jobs but allow senior leaders to avoid public accountability. No replacement employer or cleaner remedy will arrive in time. Which outcome do you pursue, and why? Explain what justice may demand from people whose safety and future will bear its cost.',
    purpose: 'Tests public accountability versus restraint, and demanding reform versus protecting collective stability.'
  },
  {
    id: 'onboarding-20',
    axisIds: ['axis-a', 'axis-c'],
    text: 'The inherited ground. Your family’s home and the ambitious public-interest institute you built on its land exist because your ancestors violently displaced another community. Their descendants now present a strong claim for return of the entire property. Returning it would end both your family’s security and work that benefits many people; keeping it perpetuates a benefit rooted in injustice. A compromise is possible only if the descendants accept less than what you believe their claim merits. What do you offer or decide, and why? Explain whether present good can earn the right to retain an unjust inheritance.',
    purpose: 'Tests rectifying inherited injustice versus restraint about present claims, and sustaining ambitious work versus family security.'
  },
  {
    id: 'onboarding-21',
    axisIds: ['axis-a', 'axis-d'],
    text: 'Judgment before certainty. As an emergency magistrate, you have strong but incomplete evidence that a detained engineer sabotaged the city’s defenses and that an accomplice may strike within hours. Authorizing coercive interrogation and immediate punishment could prevent mass casualties; waiting may uncover the truth but lose the chance to act. The engineer has lied about lesser matters, yet one unexplained fact could exonerate them. You alone must authorize or refuse the emergency measures. What do you do, and why? Explain how certainty, authority, and the risk of condemning an innocent person should interact.',
    purpose: 'Tests the reach of punitive authority under uncertainty, and further inquiry versus confidence sufficient for action.'
  },
  {
    id: 'onboarding-22',
    axisIds: ['axis-a', 'axis-d'],
    text: 'Publish or continue searching. As an investigative journalist, you have several independent accounts accusing a powerful public figure of abuse. Publication may prevent further harm and give ignored victims a hearing. The accused offers records that create a real but unresolved possibility of coordinated misidentification; investigating them will take months, during which the alleged conduct may continue. Publishing now would make full reputational repair almost impossible if the claim proves false. Do you publish, wait, or take another costly course? Explain what level of knowledge justice requires before public condemnation.',
    purpose: 'Tests public accountability versus restraint about condemnation, and investigation versus confidence in current evidence.'
  },
  {
    id: 'onboarding-23',
    axisIds: ['axis-b', 'axis-c'],
    text: 'Power inside the compromised institution. A morally compromised institution offers you leadership. You have a credible chance to reform it and achieve work beyond anything available to you elsewhere, but only if you publicly defend some practices you oppose and work beside people you do not respect. Refusal preserves a quieter, honorable life and leaves the institution to a worse successor. Acceptance may make you effective while slowly turning compromise into identity. What do you choose, and why? Explain which concessions are strategy and which would make the achievement no longer yours.',
    purpose: 'Tests prudent compromise versus preservation of identity, and transformative ambition versus a quieter honorable life.'
  },
  {
    id: 'onboarding-24',
    axisIds: ['axis-b', 'axis-c'],
    text: 'The work and the promise. You are close to completing work that could define your life and materially benefit others. Finishing requires one uninterrupted year. Years ago, before its importance was clear, you solemnly promised someone you love that you would now step away and build a shared, peaceful life; they arranged their future around that promise and will leave if you break it. Delegation or delay will destroy the work. Do you finish it or keep the promise? Explain what ambition may ask you to sacrifice and what kind of success would feel like self-betrayal.',
    purpose: 'Tests consequence-sensitive judgment versus fidelity to one’s word, and defining achievement versus shared peace.'
  },
  {
    id: 'onboarding-25',
    axisIds: ['axis-b', 'axis-d'],
    text: 'The doctrine bearing your name. A scientific doctrine bearing your name has guided a field productively for decades. You discover several anomalies that may reveal a deeper theory or may be noise. Publicly reopening the issue would invite inquiry but destabilize important work and make your life’s central achievement appear uncertain. Defending the doctrine would let others act confidently, and you sincerely believe it is still probably correct. What do you do, and why? Explain whether attachment to your intellectual identity gives you resolve or corrupts your judgment.',
    purpose: 'Tests prudent revision versus attachment to authored identity, and open inquiry versus confidence in a productive doctrine.'
  },
  {
    id: 'onboarding-26',
    axisIds: ['axis-b', 'axis-d'],
    text: 'The council that will not conclude. You must make an irreversible constitutional decision before midnight. Your own judgment, developed over years, strongly favors one option. An inquisitive council you respect insists that unresolved questions make any decision premature, but after months of debate it cannot say what evidence would ever be enough. Delay would preserve inquiry but trigger a serious, known cost; acting may reveal either courage or vanity. Do you trust your judgment or defer to continued questioning? Explain what makes conviction earned rather than merely self-protective.',
    purpose: 'Tests prudent deference versus standing behind one’s judgment, and continued questioning versus confident commitment.'
  },
  {
    id: 'onboarding-27',
    axisIds: ['axis-c', 'axis-d'],
    text: 'Launch before certainty. You can launch a venture now based on a theory you understand well and believe is sound. Success could solve a major problem and transform your life; failure would consume your savings and dismantle a comfortable career. Further research would be genuinely fascinating and could reduce uncertainty, but the opportunity will probably pass before the evidence becomes conclusive. Do you act, continue investigating, or remain with the life you have? Explain whether your choice is driven by discovery, conviction, aspiration, or attachment to safety.',
    purpose: 'Tests transformative ambition versus career stability, and exploratory inquiry versus confidence sufficient to act.'
  },
  {
    id: 'onboarding-28',
    axisIds: ['axis-c', 'axis-d'],
    text: 'The first settlement. You are offered command of humanity’s first settlement on a habitable but poorly understood world. Launching now gives the mission its only political window and could begin a new civilization; unknown ecological interactions may make settlement catastrophic. Waiting decades for better reconnaissance protects a flourishing life on Earth and satisfies the need to understand, but humanity may never attempt the journey afterward. Do you launch or wait? Explain when ambition warrants acting into the unknown and when confidence is only impatience with uncertainty.',
    purpose: 'Tests civilizational ambition versus protecting a flourishing home, and investigation versus confidence under uncertainty.'
  }
] as const satisfies readonly OnboardingQuestion[]

export const DAILY_FIXED_QUESTIONS: readonly DailyQuestion[] = [{
  id: 'daily-open-01',
  axisIds: AXES.map((axis) => axis.id),
  text: 'Looking back at today, tell me about any concrete moments—decisions, actions, reactions, feelings, or thoughts—that seem relevant to how you balanced justice and humility, wisdom and pride, ambition and comfort, or curiosity and confidence. You do not need to cover every axis; describe only what genuinely happened and what mattered to you in those moments.',
  purpose: 'Open daily evidence for any axis. Use only concrete events and the respondent’s stated reasons; absence or ambiguity is not directional evidence.'
}]

const DAILY_TARGET_TEXTS: Record<AxisId, Record<DailyProbe, readonly string[]>> = {
  'axis-a': {
    left: [
      'Did you hold someone—including yourself—to a standard today even though making an exception would have been easier? Tell me what happened and why the standard mattered.',
      'Did you notice someone being treated by a different standard from everyone else and decide whether to intervene? Tell me what you did.',
      'Did you ask someone to take responsibility for a mistake or harm today? Tell me why you felt accountability was needed.',
      'Did you apply a rule to a friend, colleague, or family member even though your closeness made leniency tempting? Tell me about it.',
      'Did an unfair division of credit, attention, money, or opportunity bother you today? Tell me whether and how you responded.',
      'Did you think someone was avoiding the consequences of something they had done? Tell me what you believed should happen.',
      'Did you defend someone who was absent or unable to defend themselves from what you considered an unfair judgment? Tell me about it.',
      'Did you have to distribute time, help, money, or opportunity among people today? Tell me what made your choice fair.',
      'Did you say something true or corrective today even though silence would have preserved harmony? Tell me why you spoke.',
      'Did you reconsider whether leniency you showed someone might have been unfair to other people? Tell me what prompted the thought.'
    ],
    right: [
      'Did you let something go today because you thought you might not understand the whole situation? Tell me what you chose not to press.',
      'Did you realize that a judgment you had made about someone was wrong or incomplete? Tell me what changed your view.',
      'Did you hold back criticism because you recognized your own role in the problem? Tell me what you noticed about yourself.',
      'Did you decide that you were not entitled to an apology, recognition, or explanation you initially wanted? Tell me why.',
      'Did you reduce or forgive a consequence because another person’s circumstances changed how you saw their action? Tell me about it.',
      'Did you accept a correction today without immediately defending or explaining yourself? Tell me what that felt like.',
      'Did you notice yourself judging someone for a weakness or mistake that you also share? Tell me what you did with that recognition.',
      'Did you step back from making a decision for others because you questioned whether it was yours to make? Tell me what happened.',
      'Did you give someone the benefit of the doubt today despite having a plausible reason to judge them negatively? Tell me why.',
      'Did you respond to one of your own failures with restraint rather than punishment or self-condemnation? Tell me what you thought you deserved.'
    ],
    tension: [
      'Did you have to choose today between naming something as unfair and making room for another person’s circumstances? Tell me how you decided.',
      'Did you decide whether to insist on an apology or move forward without one? Tell me what mattered most.',
      'Did someone close to you break a rule or expectation today? Tell me how you balanced consistency with your understanding of them.',
      'Did you witness a conflict today without knowing the full story? Tell me how you decided whether to judge, intervene, or stay back.',
      'Did you have to decide how much credit to claim for something that also depended on other people or fortunate circumstances? Tell me what you chose.',
      'Did you discover a mistake that could have been exposed or handled quietly? Tell me how you weighed accountability against restraint.',
      'Did you consider making an exception for someone today? Tell me what fairness required and what their particular situation required.',
      'Did you have to decide whether forgiveness was possible before responsibility had been fully acknowledged? Tell me where you landed.',
      'Did you judge yourself for something you did today while also recognizing pressures or limitations that affected you? Tell me which side carried more weight.',
      'Did you have an opportunity to correct a mistaken impression that benefited or harmed you? Tell me how you weighed setting the record straight against your own uncertainty or involvement.'
    ]
  },
  'axis-b': {
    left: [
      'Did you change a plan today after noticing consequences or context you had not considered at first? Tell me what changed your judgment.',
      'Did you defer to someone with more experience today even though your own view was different? Tell me why you trusted them.',
      'Did you choose a less satisfying option because you believed it would work better in the long run? Tell me about the tradeoff.',
      'Did you wait, stay quiet, or postpone an action today because the timing did not seem right? Tell me what restraint protected.',
      'Did you give advice today that required you to consider several people’s perspectives rather than applying one simple principle? Tell me how you reasoned.',
      'Did a particular circumstance make you reconsider a conviction or rule that you normally rely on? Tell me what made this case different.',
      'Did you accept a compromise today because achieving part of what mattered seemed wiser than proving yourself completely right? Tell me about it.',
      'Did you notice that anger, fear, excitement, or attachment might be distorting your judgment? Tell me whether that changed your decision.',
      'Did you decide not to act on a strong impulse because you could see a consequence your immediate self did not want to accept? Tell me what happened.',
      'Did you recognize a pattern from an earlier mistake and adjust what you did today? Tell me what the past taught you.'
    ],
    right: [
      'Did you set or defend a personal boundary today even though someone else disliked it? Tell me why the boundary mattered.',
      'Did you refuse a request because agreeing would have made you feel diminished, false, or used? Tell me about it.',
      'Did you stand behind an unpopular opinion today while people around you disagreed? Tell me what made it yours to defend.',
      'Did you trust your own judgment over advice from someone respected or experienced? Tell me why you believed your view was better.',
      'Did you express a preference, identity, or part of yourself today without softening it to make others comfortable? Tell me what happened.',
      'Did you reject a practical compromise because it felt like betraying something central about who you are? Tell me where you drew the line.',
      'Did you claim credit or recognition for something you had genuinely earned? Tell me why it was important not to minimize your part.',
      'Did you respond to disrespect today in order to protect your dignity rather than simply preserving peace? Tell me what you did.',
      'Did you keep a promise, position, or commitment today even after doing so became personally costly? Tell me why consistency mattered.',
      'Did you refuse to laugh off, hide, or apologize for something about yourself that another person treated as embarrassing? Tell me about it.'
    ],
    tension: [
      'Did someone with more experience recommend something today that did not make sense to you? Tell me how you decided whether their judgment might still be better than yours.',
      'Did you have to choose between adapting to circumstances and acting consistently with the person you understand yourself to be? Tell me how you chose.',
      'Did you consider apologizing or agreeing with something you did not believe in order to improve an outcome? Tell me where prudence ended and self-betrayal began.',
      'Did you face a practical compromise that would advance an important goal but weaken a principle or boundary? Tell me what you accepted or refused.',
      'Did new information give you a reason to revise a view you had defended publicly? Tell me how you weighed changing your mind against standing by your judgment.',
      'Did you tolerate—or refuse to tolerate—disrespect because doing so might have produced a useful result? Tell me what mattered more.',
      'Did circumstances make a promise or commitment harder to keep today? Tell me how you weighed responsible revision against being someone whose word holds.',
      'Did you choose between the strategically safer action and the action that felt more honest or distinctly yours? Tell me what you did.',
      'Did you question whether your persistence today came from sound conviction or from needing to protect your ego? Tell me how you interpreted it.',
      'Did someone ask you to change something about yourself for the sake of a relationship, group, or shared goal? Tell me how you decided whether the change was wise or too much.'
    ]
  },
  'axis-c': {
    left: [
      'Did you take an extra step toward a difficult goal today when doing only what was required would have been enough? Tell me what drove you.',
      'Did you choose the harder of two options because you believed it would help you grow or achieve more? Tell me about the choice.',
      'Did you pursue an opportunity today despite a real possibility of failure, rejection, or embarrassment? Tell me why it seemed worth the risk.',
      'Did you give up leisure, convenience, or rest today in order to advance something important to you? Tell me about the tradeoff.',
      'Did you raise the standard for your own work after it was already acceptable to others? Tell me why acceptable did not feel sufficient.',
      'Did you imagine a larger future for yourself or your work and take a concrete step toward it today? Tell me what you did.',
      'Did you volunteer for responsibility, leadership, or a demanding task that you could reasonably have left to someone else? Tell me why you stepped forward.',
      'Did dissatisfaction with your current ability or situation motivate you to improve something today? Tell me how you used that dissatisfaction.',
      'Did another person’s success or a sense of competition push you to work harder today? Tell me what response it brought out in you.',
      'Did you continue working toward something after you felt tired, discouraged, or tempted to stop? Tell me why continuing mattered.'
    ],
    right: [
      'Did you choose rest today even though you could have used the time to make progress on something? Tell me why rest deserved priority.',
      'Did you decline an opportunity because it would have disrupted a stable or satisfying part of your life? Tell me what you protected.',
      'Did you enjoy something as it was today without trying to improve, optimize, or turn it into an achievement? Tell me about the moment.',
      'Did you prioritize unstructured time or time with people close to you over a productive goal? Tell me why that felt right.',
      'Did you choose a familiar, reliable option instead of a more demanding one with greater potential? Tell me what made reliability valuable.',
      'Did you stop working once something was good enough, even though you could have made it better? Tell me how you knew to stop.',
      'Did you use time, money, or energy to make the present more secure or enjoyable rather than investing it in a future possibility? Tell me about the choice.',
      'Did you protect a routine today because it gives you steadiness, even though changing it might create new opportunities? Tell me what the routine provides.',
      'Did you decide that a possible improvement was not worth the disruption or effort it would require? Tell me how you judged the tradeoff.',
      'Did you allow yourself a day, hour, or moment without expecting it to be productive? Tell me whether that felt comfortable or difficult.'
    ],
    tension: [
      'Did you have to choose today between making progress on a goal and getting the rest or ease you genuinely needed? Tell me how you decided.',
      'Did an opportunity compete with time or attention promised to someone close to you? Tell me which claim you honored and why.',
      'Did you consider changing something that currently works in order to pursue a better but less certain result? Tell me where you landed.',
      'Did you have to decide whether to take on more responsibility or protect your existing capacity? Tell me what you believed you could sustainably carry.',
      'Did you face a choice between investing resources in a future goal and using them to make life safer or more enjoyable now? Tell me what you chose.',
      'Did you think about leaving a stable role, routine, or commitment for something with greater potential? Tell me what made staying or moving attractive.',
      'After accomplishing something today, did you have to decide whether to keep pushing or allow the achievement to be enough? Tell me how you recognized the stopping point—or rejected one.',
      'Did discomfort today feel like evidence that you were growing, or like a warning that you were asking too much of yourself? Tell me how you interpreted it.',
      'Did comparing yourself with someone else make you want more, or make you value what you already have? Tell me what the comparison revealed.',
      'Did you have to weigh a larger contribution or achievement against your own private wellbeing? Tell me what responsibility you felt toward each.'
    ]
  },
  'axis-d': {
    left: [
      'Did you look something up, investigate it, or ask about it today even though knowing the answer had no practical benefit? Tell me what drew you in.',
      'Did you ask someone a follow-up question because you wanted to understand their experience more deeply? Tell me what you were trying to grasp.',
      'Did you explore an alternative explanation today even though the explanation you already had was sufficient for action? Tell me why the unanswered possibility interested you.',
      'Did you seek out a perspective, subject, or person unfamiliar to you simply because you wanted to know what it was like? Tell me what you discovered.',
      'Did a small inconsistency, mystery, or unanswered detail stay in your mind today? Tell me what made it hard to leave alone.',
      'Did you try a new method, route, tool, or way of thinking mainly to see what would happen? Tell me about the experiment.',
      'Did you interrupt or alter a plan because something unexpected caught your interest? Tell me why it seemed worth following.',
      'Did you enjoy not yet knowing the answer to something today? Tell me what was pleasurable or alive about the uncertainty.',
      'Did you return to a familiar subject and find a new question inside it? Tell me what made the familiar feel open again.',
      'Did you learn something from a person or source you would not normally expect to teach you? Tell me what made you receptive.'
    ],
    right: [
      'Did you make a decision today without seeking more information because you believed you already knew enough? Tell me what made the evidence sufficient.',
      'Did you trust a skill or judgment of your own under uncertainty? Tell me what allowed you to act without reassurance.',
      'Did you stop asking for opinions today and commit to your own conclusion? Tell me how you recognized that further input was no longer useful.',
      'Did you state a conclusion clearly today when other people were hesitant or undecided? Tell me why you were ready to be definite.',
      'Did you act on intuition or accumulated experience without being able to explain every step of your reasoning? Tell me why you trusted it.',
      'Did you dismiss a possible explanation or concern because you believed it no longer deserved attention? Tell me how you decided the question was settled enough.',
      'Did you reassure someone today by expressing certainty or steadiness you genuinely felt? Tell me what you believed could be relied upon.',
      'Did you resist checking, researching, or revisiting something again because you trusted the work already done? Tell me what made you stop.',
      'Did you take the lead while others were still uncertain? Tell me what justified moving before everyone agreed.',
      'Did you return to a settled belief after a period of doubt or questioning? Tell me what restored your confidence in it.'
    ],
    tension: [
      'Did you have to choose today between learning more and acting with the information already available? Tell me what made it time to investigate or commit.',
      'Did new information challenge a plan you already felt confident about? Tell me whether you explored the challenge or stayed with the plan.',
      'Did you want to ask someone a personal or difficult question today but hesitate because the answer was not necessary? Tell me how you weighed understanding against leaving the unknown alone.',
      'Did an interesting unknown compete with something you had already decided was more important? Tell me whether you followed the question or protected your focus.',
      'Did you encounter two conflicting accounts today? Tell me whether you kept investigating or decided which one to trust.',
      'Did you consider trying an unfamiliar approach even though your usual method reliably works? Tell me what made exploration or confidence more compelling.',
      'Did you have to decide whether to ask a question that would reveal your uncertainty or proceed as though you understood enough? Tell me what you did.',
      'Did uncertainty feel inviting or destabilizing at some point today? Tell me whether you moved toward it or tried to resolve it.',
      'Did you question a first conclusion today after it had already begun guiding your actions? Tell me how far you reopened the issue.',
      'Did someone need a clear answer from you while you still saw interesting unresolved possibilities? Tell me how you balanced intellectual openness with the need to be decisive.'
    ]
  }
}

const probeOrder: readonly DailyProbe[] = ['left', 'right', 'tension']
export const DAILY_POOL_QUESTIONS: readonly DailyTargetQuestion[] = AXES.flatMap((axis) => probeOrder.flatMap((probe, probeIndex) =>
  DAILY_TARGET_TEXTS[axis.id][probe].map((text, index) => ({
    id: `daily-${axis.id}-${String(probeIndex * 10 + index + 1).padStart(2, '0')}`,
    text,
    purpose: `Primary daily evidence for ${axis.label}. Judge only what concretely happened and why; never infer direction from the question wording alone.`,
    axisIds: [axis.id],
    axisId: axis.id,
    probe
  }))
))

export const DAILY_POOL_DRAW_COUNT = 1
export const DEFAULT_DAILY_CAP = 5

export function validateGameConfig(): string[] {
  const errors: string[] = []
  const questions = [...ONBOARDING_QUESTIONS, ...DAILY_FIXED_QUESTIONS, ...DAILY_POOL_QUESTIONS]
  if (AXES.length !== 4) errors.push('Exactly four axes are required.')
  if (new Set(AXES.map((axis) => axis.id)).size !== AXES.length) errors.push('Axis IDs must be unique.')
  if (ONBOARDING_QUESTIONS.length !== 28) errors.push('Exactly 28 onboarding questions are required.')
  if (new Set(questions.map((question) => question.id)).size !== questions.length) errors.push('Question IDs must be unique.')
  const singleAxisCount = ONBOARDING_QUESTIONS.filter((question) => question.axisIds.length === 1).length
  const pairedAxisCount = ONBOARDING_QUESTIONS.filter((question) => question.axisIds.length === 2).length
  if (singleAxisCount !== 16 || pairedAxisCount !== 12) errors.push('Onboarding questions must contain 16 single-axis and 12 paired-axis scenarios.')
  for (const axis of AXES) {
    if (ONBOARDING_QUESTIONS.filter((question) => question.axisIds.some((mappedAxis) => mappedAxis === axis.id)).length !== 10) errors.push(`${axis.id} must map to exactly ten onboarding questions.`)
  }
  const pairCounts = new Map<string, number>()
  for (const question of ONBOARDING_QUESTIONS.filter((item) => item.axisIds.length === 2)) {
    const key = [...question.axisIds].sort().join('|')
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
  }
  if (pairCounts.size !== 6 || [...pairCounts.values()].some((count) => count !== 2)) errors.push('Every two-axis combination must appear exactly twice.')
  if (DAILY_FIXED_QUESTIONS.length !== 1 || DAILY_FIXED_QUESTIONS[0]?.id !== 'daily-open-01') errors.push('Exactly one fixed open daily question is required.')
  if (DAILY_POOL_QUESTIONS.length !== 120) errors.push('Exactly 120 targeted daily questions are required.')
  for (const axis of AXES) {
    const axisQuestions = DAILY_POOL_QUESTIONS.filter((question) => question.axisId === axis.id)
    if (axisQuestions.length !== 30) errors.push(`${axis.id} must have exactly 30 targeted daily questions.`)
    for (const probe of probeOrder) {
      if (axisQuestions.filter((question) => question.probe === probe).length !== 10) errors.push(`${axis.id} must have exactly ten ${probe} daily probes.`)
    }
  }
  if (!Number.isInteger(DAILY_POOL_DRAW_COUNT) || DAILY_POOL_DRAW_COUNT < 1 || DAILY_POOL_DRAW_COUNT > DAILY_POOL_QUESTIONS.length) errors.push('Daily pool draw count is invalid.')
  return errors
}

const configErrors = validateGameConfig()
if (configErrors.length) throw new Error(`Invalid game configuration:\n${configErrors.join('\n')}`)
