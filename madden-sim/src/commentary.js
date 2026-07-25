// Two-man booth: play-by-play (Marv) and color (Deion). Lines keyed to game events.
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export function commentate(event, payload = {}) {
  switch (event) {
    case 'presnap':
      return null;
    case 'snap':
      return payload.play?.type === 'run'
        ? ['Marv', pick(['Snap — handing it off…', 'They give it to the back…', 'Ground game here…'])]
        : ['Marv', pick(['Snap — quarterback drops to throw…', 'Play is on, looking downfield…', 'Protection holds, he surveys…'])];
    case 'handoff':
      return ['Marv', pick(['Takes the handoff!', 'Ball is off — he hits the hole!'])];
    case 'throw':
      return ['Marv', pick(['Lets it fly!', 'Airs it out!', 'Throws on time —'])];
    case 'catch':
      return ['Marv', pick(['Caught! He\'s got room!', 'Complete! Turning upfield!', 'Hauls it in!'])];
    case 'incomplete':
      return ['Deion', pick(['Nobody home. Gotta put that one on the money.', 'Ball hits the turf — good coverage on the outside.', 'He\'ll want that throw back.'])];
    case 'sack':
      return ['Deion', pick(['Brought him DOWN! Pocket collapsed in a hurry.', 'That\'s a coverage sack — nowhere to go with it.'])];
    case 'tackle':
      return payload.gain >= 8
        ? ['Deion', pick([`Big gain, ${payload.gain} yards — that\'s how you move the chains.`, `He ripped off ${payload.gain}! Defense better tighten up.`])]
        : ['Marv', pick([`Wrapped up after ${Math.max(0, payload.gain)}.`, `Brought down — gain of ${Math.max(0, payload.gain)}.`])];
    case 'broken':
      return ['Deion', pick(['Ooh, broke the tackle! Somebody grab him!', 'Ran right through the arm tackle!'])];
    case 'firstdown':
      return ['Marv', pick(['Moves the sticks — first down!', 'And that will be a fresh set of downs.'])];
    case 'td':
      return ['Marv', pick(['TOUCHDOWN! The crowd is on its feet!', 'HE\'S IN! Six points!', 'To the house! TOUCHDOWN!'])];
    case 'int':
      return ['Deion', pick(['PICKED OFF! You can\'t float it in that window!', 'Intercepted! The defense read it all the way.'])];
    case 'turnover':
      return ['Marv', pick(['Turnover on downs — the gamble does not pay off.', 'And they\'ll hand it over on downs.'])];
    case 'punt':
      return ['Marv', pick(['They\'ll punt it away.', 'Booming punt — flip the field.'])];
    case 'fg_good':
      return ['Marv', [`The kick from ${payload.dist} is UP… and it is GOOD!`][0]];
    case 'fg_miss':
      return ['Deion', [`From ${payload.dist} — no good! Pushed it wide right.`][0]];
    case 'opp_drive':
      return ['Marv', payload.pts > 0 ? 'The Redhawks answer on their possession.' : 'Great stand by the defense — they get the ball right back.'];
    case 'quarter':
      return ['Marv', `That brings us to the ${['first', 'second', 'third', 'fourth'][payload.q - 1]} quarter.`];
    case 'final':
      return ['Marv', 'And that will do it here tonight — what a football game.'];
    default:
      return null;
  }
}
