export const format = (rawComment: string): string => {
  const formattedComment = rawComment.replaceAll(/\n/g, ' ').replaceAll(/ +/g, ' ').trim()
  return formattedComment
}
