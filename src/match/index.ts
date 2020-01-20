import { Track } from 'perplexed'
import mem from 'mem'

export interface SimilarTrack extends Track {
  similarity: number,
}

const standardString = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/‐/g, '-')
    .replace(/[,!?]/g, '')
    .replace(/\s*&\s*/g, ' and ')
    .trim()
}

function compareTwoStrings (first: string, second: string) {
  first = first.replace(/\s+/g, '')
  second = second.replace(/\s+/g, '')

  if (!first.length && !second.length) return 1 // if both are empty strings
  if (!first.length || !second.length) return 0 // if only one is empty string
  if (first === second) return 1 // identical
  if (first.length === 1 && second.length === 1) return 0 // both are 1-letter strings
  if (first.length < 2 || second.length < 2) return 0 // if either is a 1-letter string

  const firstBigrams = new Map()
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first.substring(i, i + 2)
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1

    firstBigrams.set(bigram, count)
  }

  let intersectionSize = 0
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second.substring(i, i + 2)
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0

    if (count > 0) {
      firstBigrams.set(bigram, count - 1)
      intersectionSize++
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2)
}

type Index = Map<number, Track[]>

const buildIndex = mem(
  (allTracks: Track[]): Index => {
    const index: Index = new Map()
    for (const track of allTracks) {
      const { duration, deletedAt } = track

      // index does not include deleted tracks
      if (deletedAt != null) {
        continue
      }

      if (index.has(duration) === false) {
        index.set(duration, [])
      }
      index.get(duration).push(track)
    }
    return index
  },
)

const compareTwoTracks = (trackA: Track, trackB: Track): number => {
  return (
    (Math.abs(
      compareTwoStrings(
        standardString(trackA.title),
        standardString(trackB.title),
      ),
    ) +
      Math.abs(
        compareTwoStrings(
          standardString(trackA.parentTitle),
          standardString(trackB.parentTitle),
        ),
      ) +
      Math.abs(
        compareTwoStrings(
          standardString(trackA.grandparentTitle),
          standardString(trackB.grandparentTitle),
        ),
      )) /
    3
  )
}

const findSimilarTracks = (
  needle: Track,
  allTracks: Track[],
): SimilarTrack[] => {
  const index = buildIndex(allTracks)

  const similarTracks: SimilarTrack[] = []

  let range = 0
  let bestScore = 0

  while (bestScore <= 0.7 && range <= 5000) {
    const haystack =
      range === 0
        ? index.get(needle.duration) || []
        : [
          ...(index.get(needle.duration - range) || []),
          ...(index.get(needle.duration + range) || []),
        ]

    for (let i = 0; i < haystack.length; i += 1) {
      const track = haystack[i]
      if (track.id === needle.id) {
        continue
      }
      const similarity = compareTwoTracks(needle, track)
      if (similarity > bestScore) {
        bestScore = similarity
      }
      similarTracks.push({ ...track, similarity })
    }

    range += 1
  }

  return similarTracks.sort((a, b) => b.similarity - a.similarity)
}

export default findSimilarTracks
