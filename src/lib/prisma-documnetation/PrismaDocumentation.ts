export const format = (rawComment: string): string => {
  const formattedComment = rawComment.replaceAll(/\n/g, ' ').replaceAll(/ +/g, ' ')
  return formattedComment
}
