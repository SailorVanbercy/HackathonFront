export type NodeType = 'directory' | 'note';
export type TreeNode = {
    id: string;
    name: string;
    type: NodeType;
    children?: TreeNode[];
};

export type FlatItem = {
    id: string;
    name: string;
    type: NodeType;
    depth: number;
    hasChildren: boolean;
};