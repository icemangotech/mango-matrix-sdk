import Matrix from './matrix';
if (typeof window !== 'undefined') {
    (window as any).Matrix = Matrix;
}
export { Matrix };
export default Matrix;
