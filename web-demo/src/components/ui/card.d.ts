import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.ForwardRefExoticComponent<DivProps & React.RefAttributes<HTMLDivElement>>;
export const CardHeader: React.ForwardRefExoticComponent<DivProps & React.RefAttributes<HTMLDivElement>>;
export const CardTitle: React.ForwardRefExoticComponent<DivProps & React.RefAttributes<HTMLDivElement>>;
export const CardDescription: React.ForwardRefExoticComponent<DivProps & React.RefAttributes<HTMLDivElement>>;
export const CardContent: React.ForwardRefExoticComponent<DivProps & React.RefAttributes<HTMLDivElement>>;
export const CardFooter: React.ForwardRefExoticComponent<DivProps & React.RefAttributes<HTMLDivElement>>;
