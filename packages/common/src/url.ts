export const removeTrailingSlash = (path: string) => {
  let end = path.length;
  while (end > 0 && path.charAt(end - 1) === '/') {
    end--;
  }
  return path.slice(0, end);
};
