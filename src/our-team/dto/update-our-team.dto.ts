import { PartialType } from '@nestjs/mapped-types';
import { CreateOurTeamDto } from './create-our-team.dto';

export class UpdateOurTeamDto extends PartialType(CreateOurTeamDto) {}
