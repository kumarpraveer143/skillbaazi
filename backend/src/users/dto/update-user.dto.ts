import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    company?: string;
    
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}
