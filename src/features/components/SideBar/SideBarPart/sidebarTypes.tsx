export type TreeNode = {
    id: string;
    name: string;
    children?: TreeNode[];
};

export type FlatItem = {
    id: string;
    name: string;
    depth: number;
    hasChildren: boolean;
};