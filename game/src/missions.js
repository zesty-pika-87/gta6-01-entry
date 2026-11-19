// The story of Solara Bay: eight named missions from Mara Voss, Old Sal and
// The Broker. Each mission is a short plan of steps the world executes:
// goto (reach the beacon), collect (grab every crate), escape (outlast the
// heat), steal (take the named car and deliver it), race (checkpoints on a
// timer). Nothing here draws or touches the browser — it is pure data.

export const GARAGE = { x: 120, z: 120, name: 'Solara Garage' };

export const STORY = {
  hero: 'Rio Santana',
  heroLine: 'A courier with a fast car, a faster mouth, and one last shot at the Crown.',
  city: 'Solara Bay',
  intro: 'Sunrise over Solara Bay. Mara Voss needs a driver who cannot be bought — that is you, Rio.',
  victory: 'The Crown is yours. The bay is yours. Solara Bay remembers the name Rio Santana.',
};

/** The plan for mission `id` (1..8): steps in order, plus its intro/outro lines. */
export function missionPlan(id) {
  switch (id) {
    case 1:
      return { steps: [{ kind: 'goto', x: 150, z: -40, label: 'Drive to the Marina', radius: 8 }], intro: 'Mara: "Parcel for the Marina. The tide waits for no one, Rio."', outro: 'Delivered. The Marina keeper tips his hat.' };
    case 2:
      return { steps: [{ kind: 'collect', x: -120, z: 120, count: 3, label: 'Collect 3 sun-crates at Bayfront Plaza', radius: 30 }], intro: 'Old Sal: "Three crates blew off my cart. Fetch them, kid."', outro: 'All three crates home. Sal pays in cash and stories.' };
    case 3:
      return { steps: [{ kind: 'escape', seconds: 30, wanted: 2, label: 'Lose the 2-star heat — survive 30s', radius: 0 }], intro: 'Mara: "They saw the plates. Shake them on the Neon Strip."', outro: 'Clean. The Strip forgets fast when the sirens fade.' };
    case 4:
      return { steps: [{ kind: 'steal', x: -150, z: -120, carName: 'Comet GT', carColor: 0xffc93c, deliver: GARAGE, label: 'Steal the gold Comet GT — deliver to Solara Garage', radius: 8 }], intro: 'The Broker: "A gold Comet GT sits at the Harbor. Bring it to my garage."', outro: 'The Broker counts the gold paint twice. Paid in full.' };
    case 5:
      return { steps: [{ kind: 'race', points: [{ x: 0, z: 0 }, { x: 120, z: -120 }, { x: -120, z: -120 }, { x: -120, z: 120 }], time: 100, label: 'Sunset Circuit: hit all 4 checkpoints', radius: 10 }], intro: 'Jax Rivera: "Four gates, one hundred seconds. Beat me and the Strip is yours."', outro: 'Jax laughs all the way to the payout window.' };
    case 6:
      return { steps: [{ kind: 'goto', x: 120, z: 80, onFoot: true, label: 'On foot: reach the Grand Solara Hotel roof', radius: 7 }], intro: 'Old Sal: "Climb to the hotel roof and light the signal lamp."', outro: 'The lamp burns gold over the bay. The fleet sees it.' };
    case 7:
      return { steps: [{ kind: 'steal', x: 60, z: 120, carName: 'Flatbed', carColor: 0x8a7f6a, deliver: { x: -40, z: 150, name: 'Depot' }, label: 'Tow the flatbed to the Depot', radius: 8 }], intro: 'The Broker: "Flatbed broke down by the beach road. Drag it to the Depot."', outro: 'Depot stamped. The Broker nods — almost a smile.' };
    default:
      return { steps: [{ kind: 'collect', x: 80, z: -80, count: 1, label: 'Take the Solara Crown at Crown Plaza', radius: 24 }, { kind: 'escape', seconds: 20, wanted: 4, label: 'Outrun the 4-star storm — survive 20s', radius: 0 }], intro: 'Mara: "The Crown sits in Crown Plaza. Take it — and run."', outro: 'CROWN SECURED. Solara Bay has a new legend.' };
  }
}
